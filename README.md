# TexAu GTM Skills


```text
 _____             _            ____ _____ __  __   ____  _    _ _ _
|_   _|____  __   / \  _   _   / ___|_   _|  \/  | / ___|| | _(_) | |___
  | |/ _ \ \/ /  / _ \| | | | | |  _  | | | |\/| | \___ \| |/ / | | / __|
  | |  __/>  <  / ___ \ |_| | | |_| | | | | |  | |  ___) |   <| | | \__ \
  |_|\___/_/\_\/_/   \_\__,_|  \____| |_| |_|  |_| |____/|_|\_\_|_|_|___/
```

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE) [![Claude Skills](https://img.shields.io/badge/Claude-Skills-8a4fff)](https://claude.com/claude-code) [![14 skills](https://img.shields.io/badge/skills-14-blue)](./skills) [![55 MCP tools](https://img.shields.io/badge/MCP%20tools-55-green)](https://mcp.texau.com) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/CONTRIBUTING.md)

**Anyone can be a GTM engineer.** Build prospecting, enrichment, competitive intelligence, account research, pre-meeting briefings, list hygiene, cold-outreach sequences, CRM sync, and evidence scoring — inside Claude. One credit pool, 50+ real-time data providers, zero SaaS subscriptions, and Claude's scheduling feature turns any of it into a self-running workflow.

> **Stop paying for seven tools. Buy credits, install these skills, and let Claude run your go-to-market.**

---

## Get started — free 500 credits for open-source users

1. **Create an account and grab your API key:** [enrich.texau.com](https://enrich.texau.com)
2. **Trying this from GitHub? Email [support@texau.com](mailto:support@texau.com)** with a note that you found this on GitHub (or linked to your open-source project). Mention this pack and we'll credit **500 free test credits** to your account — enough for a few full prospecting + enrichment runs to see if it fits your workflow before you spend a dollar.
3. **Install the pack** (30 seconds — see below) and ask Claude to do its first GTM run.

No card on file. No trial timer. We want you to try it with real data.

---

## Why this exists

The modern GTM stack is broken by design. You pay:

- **$500–$2000/mo** for a prospecting tool (Apollo, Clay, ZoomInfo)
- **$200–$800/mo** for an email finder + verifier (Hunter, NeverBounce, ZeroBounce)
- **$300–$1500/mo** for a sending platform (Lemlist, Smartlead, Instantly, Reply.io)
- **$500–$5000/mo** for a CRM (HubSpot, Salesforce, Pipedrive, GHL)
- **$200–$1000/mo** for a competitive intel tool (Crayon, Klue)
- **$500+/mo** for a data enrichment layer (Clearbit, 6sense)

Total: **$2,200–$10,300/mo per seat**, most of which sits idle 27 days out of 30.

**TexAu flips it.** One MCP connects Claude to 55+ GTM tools across 50+ data providers. You pay per call — fractional credits — and Claude handles orchestration, ICP translation, cost optimization, and compliance. No subscription. No seats. No shelfware.

This skills pack is the opinionated brain on top. It turns every "I need to do X in my GTM stack" into one natural-language prompt.

---

## What anyone can do with this, today

Ask Claude anything from this list, and it happens:

- **"Build me 50 VP Sales at SaaS companies 200-1000 in the Bay Area. Find work emails. Verify deliverability. Rank by signal. Export as CSV."** — one prompt, full pipeline.
- **"Research Acme Corp. Firmographics, tech stack, top 10 decision makers, recent exec posts."** — a complete account brief in one round trip.
- **"Brief me every morning at 6am on everyone on my calendar that day."** — scheduled daily intelligence, delivered before coffee.
- **"Write a 4-step cold sequence for Smartlead targeting Heads of Engineering at Series B startups. Include A/B variants on step 1."** — sequence output pastes directly into Smartlead.
- **"Score these 500 leads for outbound readiness. Surface the top 25. Show me the evidence behind each score."** — auditable prioritization.
- **"Every Monday 5am, pull this week's fresh ICP matches, dedupe against our CRM, and email me the new ones."** — a recurring GTM engine, set up in 30 seconds.
- **"I have 12 Zapier automations eating my budget. Which do I actually need if I install this?"** — probably none of the ones touching data.

---

## The pack — 12 specialist skills

| Skill | What it does | Typical cost |
| --- | --- | --- |
| **[texau-gtm](./skills/texau-gtm/SKILL.md)** | Entry router. Picks the right sub-skill. Refreshes the MCP catalog if stale. | 0 |
| **[build-prospect-list](./skills/build-prospect-list/SKILL.md)** | ICP → `lead_search` / `people_search` / `profile_search`. Narrow-first, sessionId pagination, cost-gated. | 0.1–0.5 / result |
| **[enrich-and-verify](./skills/enrich-and-verify/SKILL.md)** | Profile → email → deliverability. Sync waterfall for singletons, async batch for lists. | 2 / success |
| **[account-research](./skills/account-research/SKILL.md)** | Firmographics + decision makers + tech stack + recent posts. | ~15 cr |
| **[pre-meeting-briefing](./skills/pre-meeting-briefing/SKILL.md)** | One-pager on a person before a call. Posts, comments, signals, recommended opener. | 3–12 cr |
| **[list-hygiene](./skills/list-hygiene/SKILL.md)** | Normalize → dedupe → classify → verify. Classifies before verifying — saves 50%+. | ~1 cr / row |
| **[competitive-intel](./skills/competitive-intel/SKILL.md)** | Ads + tech + posts across competitors. Compare-mode produces side-by-side grids. | 10–35 cr / company |
| **[evidence-score](./skills/evidence-score/SKILL.md)** | Rank prospects/accounts 0-100 across fit, timing, influence, engagement, reachability. Every score auditable. | 0 (reads upstream data) |
| **[sequence-builder](./skills/sequence-builder/SKILL.md)** | Paste-ready cold sequences for Lemlist / Smartlead / Instantly / Reply.io / Woodpecker / Apollo. A/B variants included. | 0 |
| **[outreach-expert](./skills/outreach-expert/SKILL.md)** | Cold-outreach strategy: sending infra, SPF/DKIM/DMARC, sequence design, deliverability, multi-channel, compliance. | 0 |
| **[crm-export](./skills/crm-export/SKILL.md)** | File format for HubSpot / Salesforce / Pipedrive / Close / Attio / GHL / CSV / NDJSON. | 0 |
| **[crm-sync-expert](./skills/crm-sync-expert/SKILL.md)** | CRM architect — API vs iPaaS vs webhook, object models, lifecycle stages, custom fields, the ten integration mistakes. | 0 |
| **[scheduled-workflow](./skills/scheduled-workflow/SKILL.md)** | Turns any skill into a recurring Claude schedule. Weekly prospect refresh, nightly enrichment, daily briefings, monthly account reviews. | 0 |
| **[cost-optimizer](./skills/cost-optimizer/SKILL.md)** | Consulted before spending. Ranks every viable path by cost. Flags anti-patterns. | 0 |

Seven of the thirteen spend zero TexAu credits — they're pure strategy, scoring, and format skills. The paid skills have hard cost ceilings.

---

## Scheduling — the unlock

Every skill that produces recurring value offers a schedule at the end. Accept once, and the workflow runs on Claude's native cron forever.

### What most users end up scheduling

| Schedule | Cadence | What it does |
| --- | --- | --- |
| Weekly ICP refresh | Mon 05:00 | Pull new leads matching your ICP, dedupe vs CRM, email you the delta |
| Nightly enrichment | 02:00 | Enrich every new CRM contact added that day — email, LinkedIn, firmographics |
| Daily morning briefing | 06:00 | Brief you on everyone on your calendar before your first meeting |
| Monthly account refresh | 1st of month | Re-pull firmographics + decision makers for your tier-1 accounts |
| Weekly competitor scan | Mon 07:00 | Pull new ads + posts + tech changes for your top 5 competitors; email the diff |
| Pre-campaign hygiene | Fri 16:00 | Verify + dedupe + classify your send list before Monday's campaign |
| Daily budget watchdog | 09:00 | Alert Slack if yesterday's spend exceeded a threshold |

Every schedule carries a **monthly credit ceiling** you set. A runaway filter can't drain your balance — the scheduled run skips if the ceiling would be exceeded.

See [scheduled-workflow](./skills/scheduled-workflow/SKILL.md) for the full set of recipes.

---

## The 60-second install

### Requirements

- Claude Code, Claude Desktop, Cursor, Windsurf, or any MCP-compatible client
- `bash`, `curl`, `jq`
- A **TexAu API key** — [enrich.texau.com](https://enrich.texau.com) *(open-source users: mention this repo to [support@texau.com](mailto:support@texau.com) for 500 free credits)*

### Install

```bash
git clone --depth 1 https://github.com/texau/texau-gtm-skills.git \
  ~/.claude/skills/texau-gtm-skills
cd ~/.claude/skills/texau-gtm-skills
./setup
```

The installer writes a routing block you paste into `~/.claude/CLAUDE.md`. That's it.

### Connect the TexAu MCP

```json
{
  "mcpServers": {
    "texau": {
      "url": "https://mcp.texau.com/mcp",
      "headers": { "x-api-key": "your-texau-api-key" }
    }
  }
}
```

Setup for every client is in the [TexAu MCP README](../texau-v3-apis/mcp-server/README.md).

### Try it

In Claude, say one of these:

- *"Build me a list of 20 VP Sales at SaaS companies 200–500 in the Bay Area, find their work emails, score them for outbound readiness, and export to CSV."*
- *"Brief me on [a LinkedIn URL] before my meeting tomorrow."*
- *"Research Acme Corp and map the buying committee."*

Watch the router fire, the cost ceiling land, the tools chain, and the result format itself.

---

## Architecture at a glance

```text
 ┌───────────────────────────┐       ┌──────────────────────────┐
 │  Claude (Code / Desktop)  │──────▶│  texau-gtm (entry skill) │
 └───────────────────────────┘       └───────────┬──────────────┘
                                                  │ routes by intent
       ┌──────────────┬──────────────┬────────────┼─────────────┬──────────────┬──────────┐
       ▼              ▼              ▼            ▼             ▼              ▼          ▼
  build-prospect  enrich-and-   account-    pre-meeting-   list-hygiene  evidence-  scheduled-
       list        verify      research      briefing                      score    workflow
       │              │             │            │             │             │         │
       └──────────────┴──────┬──────┴────────────┴─────────────┘             │         │
                             │                                                │         │
                             ▼                                                ▼         ▼
                  ┌────────────────────────────────────────────────────────────────────────┐
                  │     _lib/mcp-catalog.json — source of truth for tools + costs          │
                  │     refreshed weekly by bin/texau-skills-sync (3-layer fallback)       │
                  └───────────────────────────────┬────────────────────────────────────────┘
                                                   │
                                                   ▼
                  ┌────────────────────────────────────────────────────────────────────────┐
                  │  TexAu MCP  —  https://mcp.texau.com/mcp  (auth: x-api-key)            │
                  │  55 tools across LinkedIn / email / web / search / YouTube / AI / ...  │
                  │  50+ data providers behind the scenes; one credit pool for all         │
                  └────────────────────────────────────────────────────────────────────────┘
```

The skills are **content**, not code. They read the catalog, orchestrate the MCP's tools, and encode the GTM conventions you'd otherwise explain to every new hire.

Deep-dive: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/PRINCIPLES.md](./docs/PRINCIPLES.md)

---

## The self-refreshing catalog

Every skill reads [`_lib/mcp-catalog.json`](./_lib/mcp-catalog.json) — a snapshot of the MCP's tool surface with credit costs, categories, async/sync flags, bulk variants, and follow-up tools. **No tool names or costs are hard-coded** in any skill. When TexAu ships a new tool or changes a price, one sync run propagates the change to every skill.

### Three layers of freshness

1. **Public catalog** (`https://mcp.texau.com/catalog.json`) — no auth, preferred. *(Endpoint is on the roadmap; until it lands, layer 2 kicks in.)*
2. **MCP `tools/list`** — live tool catalog using your `TEXAU_API_KEY`, merged with curated metadata.
3. **Shipped snapshot** — always in the repo as the last-resort fallback.

Skills auto-refresh in the background when the catalog is > 7 days old. Offline? The snapshot still works.

### Upgrading the pack itself

```bash
cd ~/.claude/skills/texau-gtm-skills && git pull && ./setup
```

Idempotent. Re-running `./setup` just re-verifies perms and re-syncs.

---

## Design principles

1. **MCP is the source of truth.** Tool names, costs, and limits live in the MCP. Skills never duplicate state — they read the catalog.
2. **Narrow before wide.** Start discovery with the most selective filter. Cheaper to widen than to paginate through junk.
3. **Cheap before precise.** `people_search` (0.1) before `lead_search` (0.5) every time the filters fit.
4. **Never burn silent credits.** Any path over 20 credits gates on user confirmation.
5. **Classify before verify.** Dropping disposable/role emails for 0.5 each beats verifying undeliverable junk for 0.5 each.
6. **Bulk before loop.** Never call single-record tools in a loop when bulk variants exist.
7. **Evidence or it didn't happen.** Every claim about a company or person ties back to the tool call that produced it.
8. **Schedule what repeats.** If a workflow is valuable once, it's probably more valuable on a cadence. Ask.

Full list in [docs/PRINCIPLES.md](./docs/PRINCIPLES.md).

---

## Real-world playbook: the zero-subscription outbound engine

How a solo founder or a two-person GTM team replaces their entire stack:

1. **Monday morning** (scheduled) — `build-prospect-list` pulls 100 fresh ICP matches. `evidence-score` ranks them. Top 25 land in your inbox as CSV.
2. **Monday afternoon** — you review the 25, trim to 20. Paste into `sequence-builder`. Get a 4-step Smartlead campaign with A/B subject variants.
3. **Tuesday** — import the CSV into Smartlead. Sequence starts Wednesday.
4. **Every morning at 06:00** (scheduled) — `pre-meeting-briefing` sends one-pagers for every calendar meeting that day.
5. **Friday 16:00** (scheduled) — `list-hygiene` cleans next week's list before the Monday send.
6. **1st of each month** (scheduled) — `account-research` refreshes your tier-1 accounts. Updates push into your CRM via `crm-sync-expert` patterns.
7. **Anytime a new account heats up** — `account-research` + `competitive-intel` gives you the full picture in one prompt.

**Total software bill replaced:** ~$1,500/mo across 6 tools.
**Total TexAu spend for a full-volume outbound week (500 leads, full pipeline):** ~$15-30 in credits.
**Human time reclaimed:** the 8-12 hours per week the user used to spend on list-building, research, hygiene, and sequence copy.

---

## For contributors

See [CLAUDE.md](./CLAUDE.md) (contributor guide) and [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

Quick start:

```bash
git clone https://github.com/texau/texau-gtm-skills.git
cd texau-gtm-skills
./setup
node scripts/validate-skills.mjs   # lints every skill
```

---

## License

MIT. Fork it, extend it, build your own GTM packs on the same pattern.

---

## Prior art

We looked at how existing Claude Skill packs handle preamble contracts, update-checks, and CLAUDE.md routing — notably [garrytan/gstack](https://github.com/garrytan/gstack) — before shipping our own take. The architecture (catalog-first, three-layer freshness, credit-gated routing, schedule-native orchestration) is specific to TexAu's credit economy and doesn't carry over directly from any other pack.
