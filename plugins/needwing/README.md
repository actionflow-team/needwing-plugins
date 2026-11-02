# Needwing (plugin)

Needwing research tools for AI coding clients: the remote Needwing MCP server plus a
`needwing` skill that teaches the agent how to submit bounded research requests and read
typed, evidence-backed results.

- Remote MCP endpoint: `https://needwing.ai/mcp` (Streamable HTTP)
- Authentication: OAuth sign-in by default; optionally a static `Authorization: Bearer` key
- Tools (scope `research`): `needwing_ask`, `needwing_status`, `needwing_reply`,
  `needwing_evidence`, `needwing_stop`
- Skill: `skills/needwing/SKILL.md` (synced from the canonical served skill,
  `https://needwing.ai/api/connect/skill`)

This one plugin directory carries the manifests of every supported client format:

| Client | Manifest |
| --- | --- |
| Claude Code (and Grok Build) | `.claude-plugin/plugin.json` |
| Codex | `.codex-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` |
| Claude Code + Codex MCP config | `.mcp.json` |

Install from the marketplace in one step (Claude Code 2.1.275+):

```
/plugin install needwing --marketplace actionflow-team/needwing-plugins
```

See the repository root `README.md` for per-client install lines and the key-based
authentication variant. Service: https://needwing.ai — guides: https://needwing.ai/connect,
privacy: https://needwing.ai/privacy. Plugin files are MIT licensed.
