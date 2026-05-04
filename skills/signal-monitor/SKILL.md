---
name: signal-monitor
version: 1.0.0
description: |
  Tracks buying-signal triggers (open job postings, new ad launches, tech-stack changes, recent
  posts) across a target account list and produces a weekly trigger digest with prioritized
  outreach hooks. Designed to be scheduled. Uses linkedin_job_search, ad_search, web_tech_stack,
  post_keyword_search, and profile_activities. Different from competitive-intel (which is one-shot
  per competitor) and account-research (which is a deep one-pager) — this is recurring, multi-account,
  and trigger-focused. Proactively invoke on phrases like "monitor these accounts", "buying signals",
  "hiring intent", "trigger digest", "watch for new ads", "alert me when X starts hiring".
benefits-from: [texau-gtm, account-research, competitive-intel, scheduled-workflow, evidence-score]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - monitor these accounts
  - watch this list for buying signals
  - hiring intent
  - trigger digest
  - alert me when <company> starts hiring
  - watch for new ads from
  - account signal monitoring
  - ABM trigger system
  - intent signals
---

# signal-monitor

Multi-account, multi-signal, recurring trigger monitoring. Designed to run on a schedule and surface only the **changes** since the last sweep — so the user gets a short trigger digest, not a wall of static facts.

## Preamble — run first

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

If `CATALOG_OK: no` → stop and run `texau-skills-sync`.

## When to use this skill

| Signal | Use |
|---|---|
| One-shot deep brief on ONE company | `account-research` |
| Snapshot competitive comparison (you vs them) | `competitive-intel` |
| Recurring trigger sweep across **N accounts** | **this skill** |
| "What changed this week?" framing | **this skill** |
| Monitor a single rep, post, or news event | use raw MCP tools — overkill for one row |

The defining feature is **recurrence + delta**. If the user says "do it once," route to `account-research` or `competitive-intel`. If they say "every week" / "every Monday" / "tell me when," it's this skill.

## Phase 0 — define the watchlist + signal set

Two inputs required. Ask for both upfront if unclear.

### a. The watchlist

Either:
- A list of company names / domains / LinkedIn URLs (1-100 ideal; >100 needs strong cost confirm)
- A saved CSV the user references
- An ICP description that resolves to a list (route through `build-prospect-list` FIRST, then come back)

State the count and confirm: "Monitoring **{{N}} accounts**. OK?"

### b. The signal set

Pick the subset the user actually cares about. Each is independently costed and individually toggleable:

| Signal | Tool | Default cost / account / sweep |
|---|---|---|
| **Hiring** — new open roles | `linkedin_job_search` (scoped per company) | ~0.4–2.0 (depends on hiring volume) |
| **Ad launches** — new LinkedIn ads | `ad_search` (advertiser=company, dateFrom=last_sweep) | ~0.4–2.0 |
| **Tech-stack changes** — new pixels/SaaS | `web_tech_stack` (compare snapshot) | ~1.0 |
| **Content velocity** — new posts | `post_keyword_search` or `profile_activities` on key execs | ~0.5–2.0 |
| **Funding / news** — press releases | `search_bing` or `web_scrape` of newsroom | ~0.5 |

Default starter set: **hiring + ads** (cheapest, highest signal-to-noise for B2B SaaS). Add tech-stack only when product-led signals matter. Add content/news on explicit ask.

State per-sweep cost estimate before the first run:

> "Per-sweep cost: ~{{N * sum_signal_costs}} credits ({{N}} accounts × {{signals}}). Weekly = ~{{4 * cost}} credits/month. OK?"

## Phase 1 — establish baseline (first run only)

If this is the **first** sweep for this watchlist, the entire surface looks "new" — that's noise, not signal. Two strategies:

1. **Cold baseline** (recommended): on first run, capture state but mark everything as "baseline — not a trigger." User sees an empty digest with a note: "Baseline established. Real triggers start next sweep."
2. **Lookback baseline**: on first run, scope each signal to the last 7d (`dateFrom: 7d ago`) and treat anything in that window as "recent triggers worth knowing." Use this when the user wants signal *now*.

Ask which they want. Default to lookback if they're impatient.

Persist the baseline state to a local file (e.g. `~/.texau-skills/signal-monitor/<watchlist-id>.json`). Each sweep writes a new snapshot; the digest is the **diff** vs the previous snapshot.

## Phase 2 — sweep

Per-account, per-signal, in this order (cheapest → most expensive to keep cost-debt visible):

### 2a. Hiring sweep — `linkedin_job_search`

Scope each call to the company:

```text
linkedin_job_search(
  company: "<account>",
  datePosted: "past_week",   # or "past_month" for monthly cadence
  size: 25                   # cap per account
)
```

Diff vs baseline: surface **new jobIds only**. For each new role, optionally call `linkedin_job_detail` (0.2/call) to get the description — but ONLY for roles whose title matches a high-signal pattern the user defined (e.g. "VP Sales", "Head of RevOps"). Don't pull details for every junior role.

Output per account:
- Count of new openings
- Top 3 new role titles
- Inferred trigger type (e.g. "scaling sales = budget for tools", "hiring CRO = strategic shift")

### 2b. Ad sweep — `ad_search`

```text
ad_search(
  advertiser: "<account>",
  dateFrom: "<last_sweep_date>",
  size: 50
)
```

Diff: surface ad IDs not seen in prior snapshot. Run `ad_details` (0.5/call) on at most **the top 2 new ads per account**. Extract: creative angle, CTA, audience signals.

Trigger meaning: a company starting LinkedIn ads = active GTM motion + budget + measurable target audience. High intent for vendor outreach.

### 2c. Tech-stack diff — `web_tech_stack`

```text
web_tech_stack(domain: "<account>")
```

Diff vs baseline list of detected tools. Surface:
- **Added**: new SaaS in the stack → competitive displacement opportunity OR adjacency-sell opportunity (depending on what the user sells).
- **Removed**: ripped out tool → unhappy customer of that vendor; warm prospect for alternatives.

Trigger meaning depends entirely on what the user sells. Capture context once at watchlist creation: "What tools, when added/removed, would you want to know about?"

### 2d. Content velocity — `post_keyword_search` / `profile_activities`

For each account, optionally tracked exec(s) (capture LinkedIn URLs at watchlist creation). Run `profile_activities` (1/call) per exec; surface posts since last sweep. Skip silently if they posted nothing — don't pad the digest with low-signal "no activity" rows.

For company-page posts, use `post_keyword_search(fromCompany: "<account>")` instead.

## Phase 3 — score and rank triggers

Not every trigger deserves equal attention. Use a simple weight schema (defaults; user can override):

| Trigger | Weight |
|---|---|
| New CRO/CMO/VP-Sales hire | 10 |
| 3+ new sales roles in one sweep | 8 |
| New LinkedIn ad campaign launched | 6 |
| Tech-stack add of a tool the user explicitly tracks | 5–10 |
| Tech-stack remove of a tool the user explicitly tracks | 5–10 |
| Single new exec post | 2 |
| Single new junior role | 1 |

Per account, sum the trigger weights. Sort the digest by total score, descending. Cut the digest at the top N (default 20) — never show 100 rows.

## Phase 4 — produce the digest

Single deliverable per sweep. Markdown, scannable, max 1 page. Format:

```text
# Trigger digest — {{watchlist_name}} — {{date}}

## Top movers ({{count}} accounts changed)

### {{account_1}} — score 18
- 🟢 Hiring 4 sales roles this week (incl. "VP of Revenue Operations")
- 🟢 Launched 2 new LinkedIn ads — angle: "compliance-first observability"
- 🟡 Added Salesforce.com to stack (was on HubSpot — 14 days ago)
→ Suggested play: warm outbound to new VP RevOps; reference compliance angle. [evidence-score: 87/100]

### {{account_2}} — score 12
- ...

## Quiet accounts ({{count}})

{{list, no detail — user can drill in if curious}}

## Sweep cost: {{credits}} credits | Next sweep: {{date}}
```

Always end with cost spent + next sweep date.

## Phase 5 — persist + schedule

Write the new snapshot to `~/.texau-skills/signal-monitor/<watchlist-id>.json` (overwrites prior). Optionally also write a dated digest archive (`<watchlist-id>/digests/<date>.md`) so the user can compare digests over time.

If the user hasn't yet scheduled this, **strongly** offer it at the end:

> "Worth $X/month if I run this every Monday and email you the digest? Set it up via [scheduled-workflow](../scheduled-workflow/SKILL.md)."

This skill's value is 80% in the recurrence. One-shot signal monitoring is just `account-research` with extra steps.

## Cost ceiling

| Watchlist size | Default sweep cost (hiring + ads only) | Hard cost-gate |
|---|---|---|
| ≤25 accounts | ~25 credits / sweep | 50 credits |
| 26–100 accounts | ~100 credits / sweep | 250 credits — confirm |
| 101–500 accounts | ~500+ credits / sweep | **always** confirm; recommend bucketing into sub-watchlists |
| >500 accounts | — | refuse without explicit "I know" from the user |

Add ~1 credit / account for tech-stack and ~2 credits / account for content if those signals are enabled.

## Anti-patterns

- ❌ Running every signal on every account by default. Pick a subset; let the user opt in to more.
- ❌ Skipping the baseline phase and surfacing 500 "new" rows on day 1.
- ❌ Calling `ad_details` on every ad in every sweep. Cap to top-N per account.
- ❌ Surfacing "no activity" rows. The digest is for movers — silence is fine.
- ❌ Re-running on the same accounts more than weekly without strong signal-density justification. Diminishing returns + cost burn.
- ❌ Treating this as a research deliverable. It's a **trigger feed** — short, ranked, action-oriented.

## Follow-ups to suggest per-trigger

- 🆕 hire of decision-maker → `pre-meeting-briefing` for the new exec, or `enrich-and-verify` to source their email.
- 🆕 ad launch → `competitive-intel` for the full creative + targeting analysis.
- 🆕 tech-stack add → `account-research` to see if any other ICP signals corroborate.
- 🆕 content surge → `sequence-builder` with the new post as a personalization anchor.

## Offer to schedule this

This skill exists to be scheduled. If the user runs it once and doesn't schedule, ask once at session end:

> "Signal monitoring's value compounds when it runs every week. Want me to set up a Monday-morning digest? → [scheduled-workflow](../scheduled-workflow/SKILL.md)"

One offer. Drop if declined.
