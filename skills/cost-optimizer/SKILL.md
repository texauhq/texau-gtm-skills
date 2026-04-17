---
name: cost-optimizer
version: 1.0.0
description: |
  Advises on the cheapest TexAu tool path for a stated goal. Consulted before spending —
  turns "I want 500 CTOs with emails" into a cost-accurate plan, shows comparative
  costs for every viable path, and flags anti-patterns (loops, over-verification,
  redundant enrichment). Use when the user asks "what's the cheapest way", "how much
  will this cost", "I have N credits left — what can I do", or before any big-spend job.
benefits-from: [texau-gtm]
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
triggers:
  - cheapest way to
  - how much will this cost
  - I have N credits left
  - budget-conscious
  - save credits
  - cost estimate
---

# cost-optimizer

The credit-math skill. Never guesses — always grounds in `_lib/mcp-catalog.json`.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

Read `_lib/mcp-catalog.json` in full before answering. Never cite a credit cost from your training data — it will be wrong.

## Common goals → cost-ranked paths

### Goal: "Find N prospects matching an ICP"

| Path | Cost / result | Catch |
|---|---|---|
| **A — people_search** | 0.1 | Indexed cache; less precise on live LinkedIn state. Cheapest. |
| **B — profile_search** | 0.1 | Live LinkedIn, exact-string matching. No seniority/industry bands. |
| **C — lead_search** | 0.5 | Full 30+ filter surface, include+exclude, sessionId pagination. Use only when B can't express the ICP. |

**Rule of thumb:** A < B < C. Always ask "can A or B satisfy this?" before picking C. If the ICP mentions seniority bands, company headcount bands, or exclusion criteria → it's C.

### Goal: "Find emails for N people"

| Path | Cost | When |
|---|---|---|
| `email_finder` (waterfall, sync) | ≤2 per success, **0 on hard-fail** | N ≤ 5, or you need the result in the current turn |
| `find_emails` (batch) + `check_email_finding` | 2 per **success**, polling is free | N ≥ 10, or you have ≥100 to do |

**Rule:** Never loop `email_finder` for >5. Always batch for >5.

**Cost note:** Both paths charge *only on success* (or soft-fail). A 100-person batch where 60% hit = 120 credits, not 200.

### Goal: "Verify deliverability on N emails"

| Path | Cost | When |
|---|---|---|
| `email_verifier` (waterfall, sync) | ≤1 per verified, 0 on hard-fail | N ≤ 5 |
| `verify_emails` (batch) | 0.5 per email | N ≥ 10 |

**Rule:** Batch is cheaper per-unit *and* faster wall-clock for any list >10.

### Goal: "Enrich N LinkedIn profiles"

| Path | Cost | When |
|---|---|---|
| `enrich_profile` (singular) | 1 per call | N = 1 |
| `enrich_profiles_bulk` (up to 50) | 1 per result | Always, for N ≥ 2 |

**Rule:** Never loop `enrich_profile` for N > 1. Chunk into 50s and use bulk.

### Goal: "Understand a company"

| Path | Cost | When |
|---|---|---|
| `enrich_company` | 1 | Firmographics only |
| `web_tech_stack` | 2 | Just tech |
| `website_intelligence` | 5 | Everything web — tech + pixels + emails + social + SSL |
| `website_intelligence` + `enrich_company` | 6 | Full picture |

**Rule:** For 2+ angles on one site, `website_intelligence` always wins.

## Budget-constrained mode

If the user says "I have X credits, what can I do":

1. Call `check_usage` (free) — confirm the actual balance.
2. Enumerate options fitting within X:
   - `X // 0.1` = max `people_search` results
   - `(X - 5) // 2` = max emails you can find after 1 enrich+site scan
   - etc.
3. Present 2–3 realistic scenarios, not a menu of every possibility.

## Anti-pattern detector

Scan the user's plan for these **before** running:

| Pattern | Fix |
|---|---|
| Loop of `enrich_profile` for many profiles | Switch to `enrich_profiles_bulk` |
| Loop of `email_finder` for 20+ people | Switch to `find_emails` batch |
| Verifying emails *before* classifying | Classify first (0.5), drop roles/disposables, then verify only work+personal |
| Running `lead_search` when `people_search` satisfies the ICP | Downgrade to `people_search` (5× cheaper) |
| `web_tech_stack` + `web_pixels` + `web_social_links` together | Collapse to one `website_intelligence` (5 credits total vs 5 combined — break-even on 3 tools; cleaner output with wi) |
| `ad_details` on every ad from `ad_search` | Cap at top 3–5 by engagement/recency |
| Polling `check_email_finding` at 500ms intervals | Use exponential backoff starting at 3s |
| Re-running `search_reference_data` every session | Cache locally — it's static catalog data |

## Output shape

Give the user a **ranked cost table** + **a recommended plan**:

```
Goal: "Find 50 VP Sales at SaaS companies 200–500 in Bay Area, with verified work emails"

Ranked paths:
  Path A (lead_search + enrich_profiles_bulk + find_emails + verify_emails)
    50 × 0.5  + 50 × 1 + 50 × 2 × 0.7_hitrate + 35 × 0.5 = 152 credits
  Path B (people_search instead of lead_search) — NOT VIABLE
    people_search can't express "Director+" seniority band; skip.
  Path C (skip verification — rely on find_emails confidence score)
    50 × 0.5 + 50 × 1 + 50 × 2 × 0.7 = 135 credits (−17, but ~5% bad addresses)

Recommended: Path A. 152 credits. Budget safety: <1% of a 25k-cap plan.
Fire? [confirm]
```

## When to refuse a plan

If the user's plan is obviously wasteful and they haven't been informed:

1. Show the cheaper path + cost delta.
2. Ask confirmation before proceeding.
3. If they insist on the wasteful path, proceed — but note it in the final report.

Never silently let them burn credits.

## No-call reporter

This skill does **no** paid MCP calls — only `check_usage` (free) if needed. It's pure planning.
