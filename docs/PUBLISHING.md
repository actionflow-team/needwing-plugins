# Publishing the Needwing MCP Registry entry

`server.json` at the repository root registers the remote Needwing endpoint in the official
MCP Registry as `ai.needwing/needwing`. The name uses the reverse-DNS namespace of
`needwing.ai`, which the registry verifies through a DNS TXT record — so this runbook needs
someone with Cloudflare access to `needwing.ai`. **Nothing here has been executed yet.**

Prerequisites:

- The GitHub repository `actionflow-team/needwing-plugins` exists and this exact
  `server.json` is pushed (the registry stores metadata as published; `version` is
  immutable per publication).
- `https://needwing.ai/mcp` is publicly reachable (the registry requires remote servers to
  be publicly accessible; MCP auth makes an unauthenticated `initialize` fail by design —
  that is expected).

## 1. Install mcp-publisher

macOS / Linux (release tarball, per the registry quickstart):

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

or `brew install mcp-publisher`. Verify with `mcp-publisher --help`
(commands: `init`, `login`, `logout`, `publish`).

## 2. Generate the domain proof (DNS login)

```bash
cd /path/to/needwing-plugins
openssl genpkey -algorithm Ed25519 -out mcp-registry-key.pem     # keep this file private, outside the repo
PUBLIC_KEY="$(openssl pkey -in mcp-registry-key.pem -pubout -outform DER | tail -c 32 | base64)"
echo "needwing.ai. IN TXT \"v=MCPv1; k=ed25519; p=${PUBLIC_KEY}\""
```

(`mcp-publisher login dns --domain needwing.ai` prints the same “Expected proof record”.)
Keep `mcp-registry-key.pem` in protected storage; it is the publisher identity for the
domain.

## 3. Add the TXT record in Cloudflare

Cloudflare dashboard → the `needwing.ai` zone → DNS → Records → **Add record**:

| Field | Value |
| --- | --- |
| Type | `TXT` |
| Name | `needwing.ai` (the apex — `@` in the dashboard; the registry checks the domain itself, not a `_mcp-registry-auth` subdomain) |
| Content | `v=MCPv1; k=ed25519; p=<PUBLIC_KEY>` (the quoted record from step 2, without surrounding quotes) |
| TTL | Auto |

Wait for propagation (minutes); check with `dig +short TXT needwing.ai`.

## 4. Log in and publish

```bash
cd /path/to/needwing-plugins
mcp-publisher login dns --domain needwing.ai          # reads the TXT record, exchanges for a registry token
mcp-publisher publish                                 # validates and publishes ./server.json
```

(For CI, the login step accepts `--private-key mcp-registry-key.pem` instead of the local
keypair generated at login time — the public key in DNS must match whichever private key
signs.)

## 5. Verify

- Registry entry: browse `https://registry.modelcontextprotocol.io` for
  `ai.needwing/needwing` v`1.0.0`.
- `remotes[0]` must be `{"type": "streamable-http", "url": "https://needwing.ai/mcp"}`.

## Notes and constraints

- Once published, a `version` string cannot be changed; release updates by bumping
  `version` in `server.json` and running `publish` again (semver recommended; prerelease
  suffixes like `1.0.1-1` sort before the release — see the registry versioning page).
- If the registry reports the reverse-DNS namespace as taken or mismatched, the name must
  still match the TXT-verified domain; do not fall back to an `io.github.*` name without
  deciding to switch authentication methods (that changes the required name prefix to
  `io.github.actionflow-team/*`).
- The registry is in preview: expect possible resets before GA.
- This repository does **not** run `login` or `publish` from CI automatically; publishing is
  a deliberate, human-supervised step.
