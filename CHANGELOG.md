# Changelog

All notable changes to this pack.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [1.0.0] — 2026-04-17

Initial public release.

### Added

- **14 skills** covering the GTM surface:
  - `texau-gtm` — entry router
  - `build-prospect-list` — ICP-driven prospecting
  - `enrich-and-verify` — profile → email → deliverability chain
  - `account-research` — firmographics + decision makers + tech + posts
  - `pre-meeting-briefing` — one-pager before a call
  - `list-hygiene` — dedupe + classify + verify
  - `competitive-intel` — ads + tech + posts across competitors
  - `evidence-score` — signal scoring, 0-100, auditable
  - `sequence-builder` — Lemlist / Smartlead / Instantly / Reply.io / Woodpecker / Apollo sequences
  - `outreach-expert` — strategy, deliverability, compliance
  - `crm-export` — file formats for HubSpot / Salesforce / Pipedrive / Close / GHL / Attio
  - `crm-sync-expert` — CRM architecture for HubSpot / Salesforce / GHL / Pipedrive
  - `scheduled-workflow` — recurring Claude-scheduled workflows
  - `cost-optimizer` — cheapest-path advisory
- **Self-refreshing catalog** — `bin/texau-skills-sync` with three-layer fallback (public `/catalog.json` → MCP `tools/list` → shipped snapshot).
- **Preflight contract** — `bin/texau-skills-preflight` emits stable `KEY: value` pairs for skills to consume.
- **Static validator** — `scripts/validate-skills.mjs` lints frontmatter, preamble, links, and tool invocations against `_lib/mcp-catalog.json`.
- **CI** — `.github/workflows/validate.yml` validates on every PR and refreshes the catalog weekly.
- **Scheduling offers** — every skill that produces recurring value closes with a `scheduled-workflow` offer.
- **Docs** — `README.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/PRINCIPLES.md`, `docs/CONTRIBUTING.md`, `SECURITY.md`.

### Requires

- Claude Code / Desktop / Cursor / Windsurf / any MCP-aware client
- Bash, curl, jq
- A TexAu API key ([enrich.texau.com](https://enrich.texau.com))
