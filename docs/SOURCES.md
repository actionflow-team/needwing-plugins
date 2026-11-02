# Sources

Every external claim in the manifests and READMEs, with the doc page used and the date it
was consulted (all: **2026-11-02**, via the `web-research` skill / `searchend` web search).
Items that could not be verified are listed at the bottom.

## Claude Code plugin + marketplace

- https://code.claude.com/docs/en/plugins/marketplace-reference — `marketplace.json` lives at
  `.claude-plugin/marketplace.json`; required top-level `name`, `owner`, `plugins`; plugin
  entries need `name` + `source` (relative path from the marketplace root); entries accept
  every `plugin.json` field; unknown keys are warnings.
- https://code.claude.com/docs/en/plugins/manifest-reference — `plugin.json` fields: `name`
  required; `displayName`, `version`, `description`, `author{name,url}`, `homepage`,
  `repository`, `license`, `keywords` optional; `claude plugin validate` is the
  authoritative check; a directory with both marketplace and plugin manifest validates both
  (v2.1.289+).
- https://code.claude.com/docs/en/plugins/create-marketplace — example marketplace shape
  (`owner: {name}`, entry `source: "./plugins/…"`); skills at `skills/<name>/SKILL.md` with
  `name`/`description` frontmatter (from /en/plugins/components).
- https://code.claude.com/docs/en/mcp (env-expansion section, cross-checked on 2026-09-22
  fetch quoted by https://dev.to/rulestack/six-var-forms-five-mcpjson-fields-two-tiny-servers-what-claude-code-mcp-expansion-actually-5a1f
  and https://claudeanswers.com/mcp/mcp-environment-variables) — `.mcp.json` server entries:
  remote = `{"type": "http", "url": …}` (`streamable-http` alias exists); `${VAR}` and
  `${VAR:-default}` expansion in `command`, `args`, `env`, `url`, `headers`; unset `${VAR}`
  loads with a warning and stays literal. This is why the key variant documents
  `Authorization: Bearer ${NEEDWING_API_KEY}`.

## Codex

- Codex CLI 0.166.0 installed locally (2026-11-02): `codex plugin` exists
  (`plugin add|list|marketplace add|list|upgrade|remove`); `codex mcp add --url <URL>
  --bearer-token-env-var <VAR>` documents the streamable-HTTP + key form; OAuth options
  (`--oauth-client-registration auto|cimd|dcr`) and `codex mcp login` exist for HTTP
  servers.
- https://developers.openai.com/plugins/build/plugins (markdown twin:
  https://developers.openai.com/plugins/build/plugins.md) — plugin = `plugin.json` root
  manifest + `skills/` + `mcp.json`; `.codex-plugin/plugin.json` is the Codex-compatibility
  manifest (same fields incl. `skills`, `mcpServers: "./.mcp.json"`,
  `extensions.com.openai`); repo marketplaces live at `.agents/plugins/marketplace.json`
  with top-level `name`, optional `interface.displayName`, and entries
  `{name, source: {source: "local", path: "./plugins/…"}, policy: {installation,
  authentication}, category}`; the desktop app also reads `.claude-plugin/marketplace.json`
  as a legacy-compatible marketplace.
- https://developers.openai.com/codex/enterprise/plugin-management — supported marketplace
  files table (`.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`,
  `.claude-plugin/plugin.json` standalone) and the `.codex-plugin/plugin.json` layout
  example.
- https://developers.openai.com/plugins/deploy/submission — Codex manifest fields
  `skills` (relative dir path or array), `mcpServers` (`"./.mcp.json"`).
- https://developers.openai.com/api/docs/guides/agents-api/tools/plugins — `.mcp.json` shape
  `{"mcpServers": {"<name>": {"type": "http", "url": …}}}` for Codex packages.
- `bearer_token_env_var` config key: `codex mcp add --help` (installed 0.166.0) and
  https://developers.openai.com/codex/mcp docs surfaced via search; config.toml form
  `[mcp_servers.needwing] url = … / bearer_token_env_var = "VAR"` cross-checked on
  https://tempreon.com/guides/add-mcp-server-to-codex and
  https://www.verdent.ai/guides/codex-cli-mcp-setup-guide.

## Cursor

- https://cursor.com/docs/mcp — remote `mcp.json` entry: `{"url": …}` with optional
  `headers` (values may use `${env:VAR}`); OAuth discovery used when the server advertises
  it.
- https://cursor.com/docs/mcp/install-links — deep link
  `cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG`,
  config = base64 of `JSON.stringify(config)`.
- https://cursor.com/docs/plugins and https://cursor.com/docs/reference/plugins — Cursor
  Plugin manifest `.cursor-plugin/plugin.json`: required `name` (kebab-case); optional
  `description`, `version`, `author{name,email}`, `homepage`, `repository`, `license`,
  `keywords`, `skills`, `mcpServers` (string/object/array; inline object overrides default
  `mcp.json` discovery). Used for `plugins/needwing/.cursor-plugin/plugin.json`.
- Deep-link payload `{"type":"http","url":…}`: the docs page does not fix the config
  contents; the JSON-with-`type` payload matches a Cursor-generator-produced example link
  (decoded) posted at
  https://forum.cursor.com/t/mcp-installation-deeplink-broken/167870 (maintainer confirmed
  the link format, fixed in Cursor 3.15.12+). Not executed against a real Cursor install
  here.

## Gemini CLI

- https://google-gemini.github.io/gemini-cli/docs/extensions and
  https://geminicli.com/docs/extensions/reference — `gemini-extension.json`: `name`,
  `version`, `description`, `mcpServers` (all settings.json MCP options except `trust`),
  `contextFileName` (defaults to `GEMINI.md` when present).
- https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server — transport selection:
  `httpUrl` → Streamable HTTP, `url` → SSE, `command` → stdio; OAuth 2.0 supported for
  remote servers with automatic discovery; `headers` supported for static auth.

## MCP Registry

- https://modelcontextprotocol.io/registry/remote-servers — `server.json` remote example;
  current schema URL `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`;
  `remotes: [{type: "streamable-http", url}]`; remote servers must be publicly reachable.
- https://modelcontextprotocol.io/registry/versioning — `version` required, semver
  recommended, must be unique per publication; `1.0.0` used.
- https://modelcontextprotocol.io/registry/authentication — domain-verified namespaces are
  reverse-DNS (`ai.needwing` for `needwing.ai`); DNS auth: generate an Ed25519 keypair,
  publish `needwing.ai. IN TXT "v=MCPv1; k=ed25519; p=<PUBLIC_KEY>"`, then
  `mcp-publisher login dns --domain needwing.ai`.
- https://modelcontextprotocol.io/registry/quickstart — `mcp-publisher init|login|publish`;
  install via release tarball or `brew install mcp-publisher`.

## Grok Build compatibility

- https://docs.x.ai/build/features/skills-plugins-marketplaces — “Grok automatically reads
  Claude Code marketplaces, plugins, skills, MCPs, agents, hooks…”, which is why the README
  documents Grok Build under the Claude Code install line.

## Unverified / not executed here

- **Cursor deep link end-to-end**: link generated and decode-tested locally
  (`scripts/make-cursor-deeplink.mjs --verify`), but not clicked in a real Cursor install.
- **Gemini CLI install command**: `gemini` CLI is not installed on this machine, so
  `gemini extensions install …` was not executed; the extension manifest follows the
  published reference verbatim.
- **`mcp-publisher login dns` / `publish`**: documented from the registry docs, deliberately
  not run (no DNS control and no repo published yet; see docs/PUBLISHING.md).

## Local verification performed (2026-11-02)

- `claude plugin validate .` → **Validation passed** (marketplace manifest).
- `claude plugin validate plugins/needwing` → **Validation passed**; with `--profile
  directory` after adding `privacyPolicyUrl`/`termsOfServiceUrl`, the icon
  (the Needwing mark, `apps/portal/src/app/icon.svg` in af-homepage, rendered to a 1024×1024 PNG) and the one-step install line in the plugin
  README: **These checks found nothing to report / Validation passed**.
- `claude plugin validate . --strict` → passed. (`--profile directory` does not apply to a
  marketplace root; it wants a plugin folder.)
- Codex CLI 0.166.0 with an isolated, temporary `CODEX_HOME` (the real
  `~/.codex` was never touched):
  `codex plugin marketplace add <local checkout>` → “Added
  marketplace `needwing-plugins`”, and `codex plugin list` resolved
  `needwing@needwing-plugins` from `.agents/plugins/marketplace.json` (this also answers
  the which-file-wins question empirically for 0.166.0: the `.agents` file is used);
  `codex plugin add needwing@needwing-plugins --json` installed v1.0.0 with
  `authPolicy: ON_INSTALL`, and the cache contains `.mcp.json`, `.codex-plugin/plugin.json`
  and `skills/needwing/SKILL.md`.
- `npm test` (`scripts/validate.mjs`): 66 checks passed, 0 failed.
- `GET https://needwing.ai/api/connect/skill` (via the outbound proxy): HTTP 200,
  `text/markdown`, sha256 `1d2ed373…` — it currently serves the **pre-MCP** skill, while the
  Homepage worktree source (bundled here) additionally documents the remote MCP endpoint and
  OAuth. Expected until the Homepage change deploys; afterwards
  `NODE_USE_ENV_PROXY=1 npm run sync-skill` converges the bundle in one command (and
  `npm test` flags the drift in the meantime).
