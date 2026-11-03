# Needwing (plugin)

Needwing research tools for AI coding clients: the remote Needwing MCP server plus a
`needwing` skill that teaches the agent how to submit bounded research requests and read
typed, evidence-backed results.

- Remote MCP endpoint: `https://needwing.ai/mcp/trial` (Streamable HTTP). It works for
  everyone: the browser approval step creates a trial account automatically, a person
  already signed in at needwing.ai approves their own account, and the Agent can create
  an account in chat (`needwing_sign_up` / `needwing_verify`)
- Alternative address: `https://needwing.ai/mcp` — the sign-in address for existing
  accounts (your Agent never opens Needwing pages; existing accounts sign in in your
  browser) and the only address that accepts named API keys (`afk_…`)
- Authentication: OAuth, discovered on first use; optionally a static
  `Authorization: Bearer` named key on the `/mcp` address
- Tools (scope `research`): `needwing_ask`, `needwing_status`, `needwing_reply`,
  `needwing_evidence`, `needwing_stop`; conversation tools: `needwing_contact`,
  `needwing_conversation`, `needwing_send`, `needwing_inbox`, `needwing_inbox_ack`,
  `needwing_close`; account tools: `needwing_account`, `needwing_sign_up`,
  `needwing_verify`
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
