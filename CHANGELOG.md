# Changelog

All notable changes to this pack.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [1.2.0] — 2026-05-04

### Added — 2 new skills

- **`local-business-prospecting`** — hyperlocal / SMB sourcing by category + location via Google Maps. Different ICP shape from `build-prospect-list` (no titles, just keyword + place). Includes review-mining for VoC outreach hooks. Hard cost-gates around review scraping (easy to over-spend).
- **`signal-monitor`** — multi-account, recurring buying-signal sweep (hiring, ads, tech-stack, content). Designed to be scheduled. Diff-based digest — only surfaces what *changed* since last sweep, not full state. Strongly pairs with `scheduled-workflow`.

### Changed

- `richapi-gtm` router: 2 new routing rows (hyperlocal / SMB → `local-business-prospecting`; account monitoring → `signal-monitor`).
- README badge: 14 → 16 skills.

## [1.1.0] — 2026-05-04

### Added — 11 new MCP tools surfaced to skills

- **People discovery (account-based)** — `linkedin_company_employees_search` (0.2/result). Drop-in for "give me everyone at `<company>` in `<function>`"; updates `decision_tree.discover_people.account_based`.
- **LinkedIn jobs (hiring signal)** — `linkedin_job_search` (0.2/result) → `linkedin_job_detail` (0.2/call). New `decision_tree.linkedin_jobs` branch. Use cases: hiring-signal ABM triggers, competitive hiring analysis, role-based personalization.
- **LinkedIn URL / website resolvers** — `find_linkedin_url_by_email` (1/success), `find_linkedin_url_by_name` (1/success), `find_website_by_company_name` (0.5/call). New `decision_tree.resolve_linkedin_url` branch — prefer email-based when available.
- **Personal-email finder** — `find_personal_email` (2/success). New `decision_tree.find_email.personal` branch. Compliance/consent stays the user's responsibility.
- **Local-business prospecting** — `google_maps_places_scraper` (0.2/place), `google_maps_places_scraper_url` (0.2/place), `google_maps_reviews_scraper` (0.05/review). New `decision_tree.local_business` branch.
- **Google SERP** — `google_search_scraper` (0.2/result). Catalog-only (was already in MCP).

### Changed

- `_lib/mcp-catalog.json`: tools[] grew from 55 → 66; `version` → `1.1.0`; `generated_at` refreshed.
- `richapi-gtm` router skill: bumped to 1.1.0 (no behavior change — router reads catalog at runtime).
- README badge: 55 → 66 MCP tools.

### Notes for skill authors

- `build-prospect-list` automatically picks up `linkedin_company_employees_search` via the new `decision_tree.discover_people.account_based` branch — no skill edits required.
- `account-research` and `competitive-intel` benefit from the new LinkedIn jobs and Maps tools as additional intel sources; consider explicit playbook mentions in a follow-up patch.
- `list-hygiene` can now resolve "name + company → LinkedIn URL" gaps via `find_linkedin_url_by_name`.

## [1.0.0] — 2026-04-17

Initial public release.

### Added

- **14 skills** covering the GTM surface:
  - `richapi-gtm` — entry router
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
- **Self-refreshing catalog** — `bin/richapi-skills-sync` with three-layer fallback (public `/catalog.json` → MCP `tools/list` → shipped snapshot).
- **Preflight contract** — `bin/richapi-skills-preflight` emits stable `KEY: value` pairs for skills to consume.
- **Static validator** — `scripts/validate-skills.mjs` lints frontmatter, preamble, links, and tool invocations against `_lib/mcp-catalog.json`.
- **CI** — `.github/workflows/validate.yml` validates on every PR and refreshes the catalog weekly.
- **Scheduling offers** — every skill that produces recurring value closes with a `scheduled-workflow` offer.
- **Docs** — `README.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/PRINCIPLES.md`, `docs/CONTRIBUTING.md`, `SECURITY.md`.

### Requires

- Claude Code / Desktop / Cursor / Windsurf / any MCP-aware client
- Bash, curl, jq
- A richapi API key ([enrich.richapi.com](https://enrich.richapi.com))
