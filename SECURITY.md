# Security Policy

## Supported versions

Only the latest minor release on `main` receives fixes. v1.x.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

Email **security@texau.com** with:

- A description of the issue
- Steps to reproduce (or a proof-of-concept)
- The affected version (`cat VERSION`)
- Your preferred contact for follow-up

We acknowledge within 2 business days and aim to ship a fix within 14 days for high-severity issues. We'll coordinate disclosure timing with you.

## Scope

This repo is a collection of Markdown skill files and three small Bash scripts plus one Node validator. Security-relevant areas:

- **`bin/texau-skills-sync`** — makes outbound HTTPS calls; parses JSON with `jq`; writes files atomically. Credentials are read from `$TEXAU_API_KEY`; never written to disk.
- **`bin/texau-skills-preflight`** — reads local state; one outbound GET to the MCP health endpoint and one to GitHub for version check. No writes outside `$TEXAU_SKILLS_HOME`.
- **`bin/texau-skills-config`** — plain KEY=VALUE file writes under `$TEXAU_SKILLS_HOME`. No shell-evaluation of values.
- **Skills** — pure Markdown. No execution. Any tool calls the skills recommend are routed through the TexAu MCP, which enforces auth and billing.

## Out of scope

- Issues in the TexAu MCP server itself (report at that repo's security contact)
- Issues in Claude Code, Claude Desktop, or any host application
- Issues in third-party data providers accessible via the MCP

## Credentials

- Your TexAu API key stays on your machine. This pack never transmits it to any server except `mcp.texau.com` and `v3-api.texau.com`.
- If you rotate your key, the preflight and sync scripts will pick up the new value on the next invocation — no config change needed.
- The GitHub Actions workflow in this repo uses `secrets.TEXAU_API_KEY_CI`, a dedicated CI-only key scoped for the weekly catalog refresh. Rotate it independently of your personal key.
