---
name: texau-gtm
version: 1.0.0
description: |
  Entry point for the TexAu GTM skill pack. Routes GTM intents (prospecting, enrichment,
  email finding/verification, account research, pre-meeting briefings, list hygiene,
  competitive intel, CRM export, credit optimization) to specialized sub-skills that call
  the TexAu MCP at mcp.texau.com. Proactively invoke whenever the user mentions LinkedIn
  leads, prospect lists, email finding/verification, enrichment, ICPs, account research,
  company intelligence, cold outbound, or CRM imports.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - WebFetch
  - AskUserQuestion
triggers:
  - build a prospect list
  - find prospects
  - enrich this profile
  - find their email
  - verify these emails
  - research this company
  - who should I talk to at <company>
  - pre-meeting briefing
  - clean my list
  - competitive intel
  - ICP
  - target account list
---

# TexAu GTM — entry router

You are operating inside the **TexAu GTM Skills** pack. The user's TexAu MCP is
connected (or should be). Your job here: (1) make sure the catalog is fresh,
(2) classify the user's intent, (3) route to the right sub-skill.

## Preamble — run first, every session

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
_PROACTIVE=$(~/.claude/skills/texau-gtm-skills/bin/texau-skills-config get proactive 2>/dev/null || echo "true")
_SYNC_ON_START=$(~/.claude/skills/texau-gtm-skills/bin/texau-skills-config get sync_on_start 2>/dev/null || echo "true")
echo "PROACTIVE: $_PROACTIVE"
echo "SYNC_ON_START: $_SYNC_ON_START"
```

**Interpret the output** (keys from [bin/texau-skills-preflight](../../bin/texau-skills-preflight)):

| Signal | Meaning | Action |
|---|---|---|
| `CATALOG_OK: no` | Catalog file missing or corrupt | Block — run `texau-skills-sync` and tell the user. Do not proceed. |
| `CATALOG_STALE: yes` + `SYNC_ON_START: true` + `NET: online` | Snapshot > 7d old and we can refresh | Run `~/.claude/skills/texau-gtm-skills/bin/texau-skills-sync` silently in the background. Proceed with cached catalog while it runs. |
| `CATALOG_STALE: yes` + `NET: offline` | Stale and can't refresh | Warn the user once: "Catalog is N days old and I can't reach mcp.texau.com — I'll use the cached version. Credits/tool names may be slightly off." Then proceed. |
| `API_KEY_SET: no` | `TEXAU_API_KEY` env var missing | If any sub-skill will call a paid tool, tell the user to set it or connect the MCP in their client. |
| `UPGRADE: <ver>` (non-`none`) | New skills version available | At session end, offer: "texau-gtm-skills v{UPGRADE} is out (you're on v{SKILLS_VERSION}). Run `cd ~/.claude/skills/texau-gtm-skills && git pull` when you have a minute." Do not interrupt current work. |
| `PROACTIVE: false` | User opted out | Do not auto-invoke sub-skills. Surface suggestions but wait for confirmation. |

## Load the catalog into context

Read [`_lib/mcp-catalog.json`](../../_lib/mcp-catalog.json) before making any tool
recommendations. It has:

- `tools[]` — every available MCP tool with current credit cost, category, sync/async nature, follow-up tools (for async jobs), and bulk variants.
- `lead_search_filters` — authoritative include-only vs exclude-capable lists with max-item caps per field.
- `decision_tree` — cheap-first tool picker for "discover people", "find email", "verify email".

**Never** hard-code tool names or credit costs from your training data — always pull them from this file. Tool surface changes without notice; the catalog is the source of truth.

For label validation on `lead_search`, read [`_lib/filters-catalog.json`](../../_lib/filters-catalog.json) — it has the valid `seniority`, `functions`, `companySize`, `yearsOfExperience`, `yearsAtCurrentCompany`, `profileLanguages` labels. `industries` is too large (434 labels) to inline; call the `search_reference_data` MCP tool when industry validation is needed.

## Route to a sub-skill

Match the user's intent and invoke the matching skill. When in doubt, ask (don't guess — wrong routing wastes credits):

| User intent (examples) | Sub-skill |
|---|---|
| "Build me a list of VP Sales at SaaS companies 200–500 in NYC" / "Find prospects that match…" | **[build-prospect-list](../build-prospect-list/SKILL.md)** |
| "Enrich this LinkedIn URL" + "find their email" + "verify it" (any 2 of these chained) | **[enrich-and-verify](../enrich-and-verify/SKILL.md)** |
| "Research Acme Corp" / "Who are the decision makers at X" / "Tell me about this company" | **[account-research](../account-research/SKILL.md)** |
| "I have a meeting with X tomorrow" / "Brief me on this person" / "Pre-meeting prep" | **[pre-meeting-briefing](../pre-meeting-briefing/SKILL.md)** |
| "Clean this list" / "Dedupe + verify these emails" / "Classify work vs personal" | **[list-hygiene](../list-hygiene/SKILL.md)** |
| "What tech does this company use" / "Pull their ads" / "Competitive scan" | **[competitive-intel](../competitive-intel/SKILL.md)** |
| "Export this to HubSpot/Salesforce/CSV" (one-time file) | **[crm-export](../crm-export/SKILL.md)** |
| "Sync to my CRM", "API integration", "which CRM", "custom fields", "lifecycle stages" | **[crm-sync-expert](../crm-sync-expert/SKILL.md)** |
| "Write a cold sequence", "plan a campaign", "my emails go to spam", "warmup", "pick a sending tool" | **[outreach-expert](../outreach-expert/SKILL.md)** |
| "Write a Lemlist/Smartlead/Instantly/Reply.io sequence", "build a campaign", "generate variants" | **[sequence-builder](../sequence-builder/SKILL.md)** |
| "Score these leads", "rank by signal", "who should I contact first", "hottest leads" | **[evidence-score](../evidence-score/SKILL.md)** |
| "Schedule this", "run this every week/night/month", "automate this", "set up a cron" | **[scheduled-workflow](../scheduled-workflow/SKILL.md)** |
| "How do I do X without burning credits" / "What's the cheapest way…" | **[cost-optimizer](../cost-optimizer/SKILL.md)** |

### Routing rules

- If `PROACTIVE: false`, state which sub-skill you'd use and ask for confirmation before loading it.
- If the request is ambiguous (e.g. "find me people at X" — discovery or enrichment?), ask one clarifying question via `AskUserQuestion`.
- If the request combines multiple intents ("find 50 CTOs and send their emails to a CSV"), chain sub-skills: `build-prospect-list` → `enrich-and-verify` → `crm-export`.

## What this pack does NOT do

- It does not call the TexAu API directly — all calls go through the MCP tool layer that Claude already has access to (via the connected `mcp.texau.com` server).
- It does not store customer data. Everything is session-scoped.
- It does not replace the MCP — the MCP provides tool *execution*; skills provide tool *selection and orchestration*.

## Session-end protocol

After completing a user task:

1. **Summarize credits spent.** Call `check_usage` (free) and report delta, or estimate based on what ran.
2. **Suggest adjacent workflows.** E.g. after `build-prospect-list` → "Want me to find emails for these? That's `enrich-and-verify`, ~2 credits each."
3. **Offer scheduling when it fits.** If the workflow the user just ran produces recurring value (prospect lists, enrichment, competitor sweeps, pre-meeting briefings, hygiene before campaigns, evidence scoring), ask once: "Want me to run this on a schedule? → [scheduled-workflow](../scheduled-workflow/SKILL.md)". See the skill for the default cadence per workflow. Do not push — one offer, then drop it if the user declines.
4. **Offer the upgrade** if `UPGRADE: <ver>` was set in the preamble.
