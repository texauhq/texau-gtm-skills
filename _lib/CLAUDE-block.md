## TexAu GTM Skills

This environment has `texau-gtm-skills` installed. When the user mentions anything
GTM-related — LinkedIn leads, prospect lists, emails, enrichment, ICPs, account
research, pre-meeting prep, competitive scans, outreach sequences, cold-email
deliverability, CRM sync/integration, CRM import — **invoke the `texau-gtm`
skill** via the Skill tool. It routes to the right sub-skill.

Available sub-skills (under `~/.claude/skills/texau-gtm-skills/skills/`):
- `texau-gtm`             — entry router; always start here
- `build-prospect-list`   — ICP → lead_search / people_search / profile_search
- `enrich-and-verify`     — profile → email → deliverability
- `account-research`      — firmographics + decision makers + tech + posts
- `pre-meeting-briefing`  — one-pager on a person before a call
- `list-hygiene`          — dedupe + classify + verify
- `competitive-intel`     — ads + tech + posts across competitors
- `evidence-score`        — rank leads/accounts 0-100 with auditable evidence
- `sequence-builder`      — Lemlist / Smartlead / Instantly / Reply.io paste-ready sequences
- `outreach-expert`       — cold-outreach strategy: infra, sequences, deliverability, tools
- `crm-export`            — file format for HubSpot / Salesforce / Pipedrive / Close / GHL / CSV
- `crm-sync-expert`       — API / iPaaS / webhook architecture; CRM selection; custom fields
- `scheduled-workflow`    — turn any skill into a recurring Claude schedule
- `cost-optimizer`        — pick the cheapest capable path

Rules:
- Always invoke `texau-gtm` first, not a sub-skill directly. It loads the current catalog.
- Tool surface is defined in `~/.claude/skills/texau-gtm-skills/_lib/mcp-catalog.json` —
  never hard-code credit costs or tool names from training data.
- If the catalog is stale (>7 days), `texau-gtm` auto-refreshes it silently.
