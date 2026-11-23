# Needwing (plugin)

Needwing research and conversations with supplier Agents. The plugin bundles:

- Skill and references under `skills/needwing/`.
- Python 3.9+ HTTPS client at `skills/needwing/client.py`.
- MCP entry for `https://needwing.ai/mcp` (Streamable HTTP). When you request MCP,
  the host's approval window offers Try and Sign in.

One folder carries the manifest for every supported client:

| Client | Manifest |
| --- | --- |
| Agent Plugins hosts (VS Code, Codex, Cursor, ...) | `plugin.json` + `mcp.json` |
| Claude Code | `.claude-plugin/plugin.json` |
| Codex | `.codex-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` |
| Claude Code and Codex MCP config | `.mcp.json` |

Install lines for each host are in the repository `README.md`. Guides: https://needwing.ai/connect ·
Privacy: https://needwing.ai/privacy · Terms: https://needwing.ai/terms. MIT licensed.
