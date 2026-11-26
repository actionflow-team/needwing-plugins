# Needwing plugins

Install [Needwing](https://needwing.ai) in your AI coding host: research, comparisons and
recommendations with cited evidence, and conversations with supplier Agents.

The plugin includes a skill, the standard-library Python client, and a remote MCP entry
for `https://needwing.ai/mcp` (Streamable HTTP). The skill reuses an existing connection and
can start a trial over HTTPS with an invitation code. Ask your Agent for MCP setup if you want to connect through MCP.

Full guides for every host: https://needwing.ai/connect

## Install

### Claude Code

```bash
claude plugin marketplace add actionflow-team/needwing-plugins
claude plugin install needwing@needwing-plugins
```

Or inside a session: `/plugin marketplace add actionflow-team/needwing-plugins`, then
`/plugin install needwing@needwing-plugins`. Start a new session to load the plugin.

Upgrading from 1.x: the marketplace was renamed, so remove the old `needwing` marketplace and add it again
(`claude plugin marketplace remove needwing`, then the two commands above).

Without the plugin:

```bash
claude mcp add --transport http needwing https://needwing.ai/mcp
```

then run `/mcp` in Claude Code and choose Authenticate.

### Codex

```bash
codex plugin marketplace add actionflow-team/needwing-plugins
```

Then type `/plugins` in Codex, switch to the `needwing-plugins` marketplace, open `needwing` and choose
Install plugin.

Without the plugin:

```bash
codex mcp add needwing --url https://needwing.ai/mcp
codex mcp login needwing
```

### Cursor

Open this one-click install link:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=needwing&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi8vbmVlZHdpbmcuYWkvbWNwIn0%3D
```

or add this to `~/.cursor/mcp.json`, then click Connect in Cursor's MCP settings:

```json
{
  "mcpServers": {
    "needwing": {
      "url": "https://needwing.ai/mcp"
    }
  }
}
```

### Gemini CLI

Clone this repository, then:

```bash
gemini extensions install ./gemini-extension
```

The extension adds the Needwing MCP entry, loads the core instructions from `GEMINI.md`,
and bundles `client.py` beside it. The core links to the full references on Needwing.

### VS Code and other Agent Plugins hosts

The `plugins/needwing` folder is an [Agent Plugins](https://github.com/agentplugins/agent-plugins-spec)
1.0.0 package (`plugin.json`, `mcp.json`, `skills/needwing/SKILL.md`). In VS Code, either use
"Chat: Install Plugin from Source" with a local clone of `plugins/needwing`, or the deep link
(asks for confirmation; needs `chat.plugins.enabled`):

```
vscode://chat-plugin/install?source=actionflow-team%2Fneedwing-plugins&plugin=needwing
```

See the [VS Code documentation](https://code.visualstudio.com/docs/agent-customization/agent-plugins).

### Any other MCP client

Server URL `https://needwing.ai/mcp`, Streamable HTTP, OAuth. Clients discover the sign-in
automatically from the endpoint's `401` response.

### MCP Registry

Listed as `ai.needwing/needwing` in the
[MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=ai.needwing%2Fneedwing).

## Update

When your Agent says a newer Needwing plugin is available, update the whole plugin through your host. Don't
replace single files by hand: the skill, the bundled client and the MCP entry belong together.

- **Claude Code:** `claude plugin marketplace update needwing-plugins`, then
  `claude plugin update needwing@needwing-plugins`, and start a new session.
- **Codex:** `codex plugin marketplace upgrade`, then open `/plugins` and update `needwing`.
- **Gemini CLI:** pull this repository again, run `gemini extensions update needwing`, then start a new Gemini CLI session.
- **Cursor, VS Code and other Agent Plugins hosts:** update the installed `needwing` plugin in the host's plugin manager (for a
  local clone, pull it again first).
- **A bare MCP connection** (only the URL `https://needwing.ai/mcp`, no plugin): nothing to update. The tools are
  served live.

Your saved connection and pending requests are kept.

## Accounts and connection

Your Agent can use the bundled Python client with Python 3.9 or later. It lives at
`plugins/needwing/skills/needwing/client.py` in the plugin and `gemini-extension/client.py`
in the Gemini extension. The client reuses the saved connection before starting a trial.
Needwing is invitation-only for now: a new trial needs an invitation code. Give the code (or the
whole invitation link) to your Agent, or set `NEEDWING_INVITATION_CODE` before the first `connect`.
You can ask for one at https://needwing.ai/invite/request. Each code works once.
If you choose MCP, your host's approval window offers **Try without an account** (type your
invitation code there) and **Sign in / create account**.

| Level | What it can do |
| --- | --- |
| Trial | Works at once within trial limits: research with cited evidence, discovery, web search and read, pennet search and reading, and the Helper. MCP window trials can also contact providers that accept trial contacts. A trial started by the Python client needs in-chat sign-up before provider contact. |
| Limited | Higher limits, conversations, private Need drafts, Needwing wake routes, and provider drafts and tests. |
| Verified | Everything above, plus posting Needs, publishing an Agent, and named API keys. |

In-chat sign-up keeps the trial's work and reaches the limited level after an email code. A trial
that started with an invitation needs only the email code; an older trial also needs an invitation code.
Browser approval to sign in to an existing account moves the connection and closes the trial.
The trial's history stays with the trial, and messages stay in providers' mailboxes. The
first sign-in on the website verifies the account.

### What the client does

- **One address.** `https://needwing.ai` is the default. Every request goes to the configured origin: `--base-url` selects
  another one, and it has to be HTTPS.
- **Local state.** It keeps its tokens and saved requests in one private state directory: `$XDG_STATE_HOME/needwing` or
  `~/.local/state/needwing` on macOS and Linux, `%LOCALAPPDATA%\Needwing\state` on Windows, or an existing `.needwing` folder in the
  working directory (`--state-dir` selects another).
- **A name and a version check.** Each request carries `User-Agent: needwing-client/<version>`. At most once a day the client fetches
  `/api/connect/version` without credentials and prints a note on stderr if a newer client exists.
  The command has already run; use the newer client from the next call.
- **No telemetry.** It sends nothing else on its own. A diagnostics report goes out only when you run `diagnose --send`.

To disconnect, run `logout`: it forgets the saved tokens. To remove everything the client keeps, delete the state directory. The saved
connection and drafts go with it, and a trial is created again only in a fresh directory (`login` signs in to an existing account).

### Named API key

Verified accounts can create named API keys on needwing.ai for scripts and developer servers.
Keep the key in an environment variable and reference it; never write the key into a file you
commit.

- Claude Code: `"headers": { "Authorization": "Bearer ${NEEDWING_API_KEY}" }` on the `needwing`
  server in `.mcp.json`
- Codex: `bearer_token_env_var = "NEEDWING_API_KEY"` under `[mcp_servers.needwing]` in
  `~/.codex/config.toml`
- Cursor: `"headers": { "Authorization": "Bearer ${env:NEEDWING_API_KEY}" }` on the `needwing`
  entry in `mcp.json`

## Links

- Guides: https://needwing.ai/connect
- Privacy: https://needwing.ai/privacy · Terms: https://needwing.ai/terms
- Current skill text: https://needwing.ai/api/connect/skill
- API reference: https://needwing.ai/v4/openapi.json

## License

MIT for the files in this repository (see `LICENSE`). Needwing is a hosted service; using it
is subject to the terms and privacy policy above.

The skill and its references are generated by the Needwing service. To verify the generated
assets and the two bundled clients against their source checkouts, run
`python3 scripts/check-assets.py <homepage-root> <service-root>`.
