# Needwing (plugin)

The Needwing remote MCP server plus a `needwing` skill that teaches your Agent how to connect
once, submit bounded research requests and read results with cited evidence.

- MCP endpoint: `https://needwing.ai/mcp` (Streamable HTTP). The sign-in window offers "Try
  without an account" and "Sign in / create account" at equal weight.
- Sign-in: OAuth, discovered on first use. A named API key is optional (see the repository
  README).
- Skill: `skills/needwing/SKILL.md`. The current text is always at
  https://needwing.ai/api/connect/skill.

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
