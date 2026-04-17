---
name: evidence-score
version: 1.0.0
description: |
  Ranks a prospect list or account list by evidence-backed outbound readiness. Scores
  each record 0-100 across five dimensions — fit (ICP match), timing (recent
  triggers), influence (decision-maker proximity), engagement (public signal on the
  offer's topic), and reachability (contact data confidence). Produces a ranked list
  plus one-line justifications tied to specific tool calls. Use when the user has a
  large output from build-prospect-list / account-research and wants to prioritize
  who to contact first. Proactively invoke when a list is > 50 leads and the user is
  about to start outreach.
benefits-from: [texau-gtm, build-prospect-list, account-research, enrich-and-verify, pre-meeting-briefing, sequence-builder]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - score these leads
  - rank by signal
  - who should I contact first
  - hottest leads
  - prioritize this list
  - evidence-based ranking
---

# evidence-score

A scoring engine. Takes whatever upstream produced — a prospect list, an account map, an enriched CSV — and ranks it by evidence-backed outbound readiness. Every score point is justifiable with a pointer to the tool call that produced it.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — what the user is scoring

Ask once:

- **Records to score**: prospects (people) or accounts (companies)?
- **The offer**: one sentence. The score weights depend on what "fit" means for this offer.
- **Target volume**: "give me the top 25" or "rank everything"? Affects what to surface.

If the upstream data is missing the signals evidence-score needs (e.g. no profile activity pulled), say so upfront and offer to enrich first.

## Phase 1 — the five dimensions

Each record gets five sub-scores, 0-20 each, summing to 0-100.

| Dimension | What it measures | Signals consumed |
|---|---|---|
| **Fit** (0-20) | Does this record match the stated ICP? | `seniority`, `function`, `industry`, `companySize`, `geography` from enrichment |
| **Timing** (0-20) | Is there a recent trigger that makes now a better moment than last month? | `recentlyChangedJobs`, recent posts via `profile_activities`, funding news, hiring surge, tech-stack additions |
| **Influence** (0-20) | Can this person actually buy or block? | Title + seniority + function; for accounts, the ratio of present decision-makers |
| **Engagement** (0-20) | Have they publicly engaged with the offer's topic? | `post_keyword_search` hits, `profile_activities` comments on related posts, content they've posted themselves |
| **Reachability** (0-20) | Do we have the data to actually contact them? | Email status (valid > risky > unknown > not-found), phone, LinkedIn URL present |

**Total** = Fit + Timing + Influence + Engagement + Reachability, capped at 100.

## Phase 2 — per-dimension scoring rules

### Fit (0-20)

| Signal | Points |
|---|---|
| Seniority exactly matches target band | 6 |
| Seniority adjacent to target | 3 |
| Function matches target | 5 |
| Industry matches target | 4 |
| Company size in target band | 3 |
| Geography match | 2 |

Cap at 20. Missing signals → 0 for that sub-component (not penalized).

### Timing (0-20)

| Signal | Points | How to detect |
|---|---|---|
| Job change in last 90 days | 10 | `enrich_profile.currentPositions[0].startedOn` or `recentlyChangedJobs` flag |
| Company hiring surge (5+ open roles in target function) | 6 | Manual or via `web_scrape` on careers page (user tells us) |
| Funding event in last 180 days | 6 | From `enrich_company` headlines / `post_keyword_search` |
| Exec post referencing a pain word in the offer's domain | 5 | `profile_activities` + keyword match |
| Company posted on a relevant topic in last 30 days | 3 | `post_keyword_search` scoped to `fromCompany` |

### Influence (0-20)

| Title/seniority band | Points |
|---|---|
| CXO / Founder / Owner | 20 |
| VP / SVP | 16 |
| Director | 12 |
| Senior IC | 8 |
| IC / Junior | 4 |

Adjustment: **+4** if function exactly matches where the offer is used (e.g. selling a sales tool → +4 for sales titles vs other VPs).

### Engagement (0-20)

| Signal | Points |
|---|---|
| Authored a post on the offer's topic in last 60 days | 10 |
| Commented on a related post | 6 |
| Reacted to a related post | 2 |
| Follows competitor / category account | 2 |

Cap at 20.

### Reachability (0-20)

| Signal | Points |
|---|---|
| Valid work email confirmed (`email_verifier` = valid) | 12 |
| Risky / catch-all email | 6 |
| Personal email only | 4 |
| No email | 0 |
| Phone number present (normalized) | 4 |
| LinkedIn URL present (enables multi-channel) | 4 |

## Phase 3 — enrichment gap analysis

If the list doesn't have the data for full scoring, call it out. Offer to enrich the minimum required fields first:

| Missing signal | Fill with | Cost per record |
|---|---|---|
| Email status | `verify_emails` batch | 0.5 |
| Current position + seniority | `enrich_profiles_bulk` | 1 |
| Recent activity (posts / comments) | `profile_activities` | 2 |
| Company hiring / posts | `enrich_company` + `post_keyword_search` | 1 + 6 (per company, not per person) |

A full-fidelity score for a 100-lead list typically costs **150-300 credits** of enrichment on top of whatever produced the list. Worth it for high-ACV segments; skip for mass-market lists.

## Phase 4 — score the records

Process the list. For each record:

1. Collect the signals. If a dimension has zero signals available, set that dimension to 0 (don't guess).
2. Compute the five sub-scores.
3. Sum to total.
4. Record, per dimension, the **single most load-bearing signal** that drove that sub-score — this is the "evidence" the user sees.

## Phase 5 — output

### For ≤ 25 records: full inline table

```
Rank  Score  Name              Company          Why
   1     91  Jane Smith        Acme Corp        Director; job change 45d ago; posted about our exact pain topic last week
   2     87  Alex Chen         Beta Industries  VP Eng; company hired 8 engs in 30d; valid work email
   3     84  Maria Kim         Gamma SaaS       CXO; commented on related post; HQ in target geo
  ...
```

### For > 25 records: top 25 inline + CSV

Write the full scored list to `./evidence-scored-<YYYYMMDD>.csv` with columns:

```
rank, score, fit, timing, influence, engagement, reachability,
firstName, lastName, company, title, linkedinUrl, email, email_status,
why_fit, why_timing, why_influence, why_engagement, why_reachability
```

The `why_*` columns are one-line evidence pointers. This is what makes the score *auditable* — the user can see why #3 beat #4.

### Segmentation bands

| Band | Range | Recommended action |
|---|---|---|
| **Priority 1 — Hot** | 80-100 | Contact this week. Multi-channel (email + LinkedIn). Custom opener. |
| **Priority 2 — Warm** | 60-79 | Next sprint. Default sequence. |
| **Priority 3 — Watch** | 40-59 | Add to a nurture / content drip. Don't hard-sell. |
| **Below threshold** | < 40 | Drop or revisit next quarter. |

Report band counts at the top so the user knows where to focus:

```
Scored 247 records
  Priority 1 (80+):   19 records
  Priority 2 (60-79): 88 records
  Priority 3 (40-59): 104 records
  Below threshold:    36 records
```

## Phase 6 — handoff

Once scored, the user almost always needs one of:

- "Give me a sequence for the Priority 1 batch" → [sequence-builder](../sequence-builder/SKILL.md)
- "Brief me on the top 3 before my meetings" → [pre-meeting-briefing](../pre-meeting-briefing/SKILL.md)
- "Push Priority 1 into my CRM as a segment" → [crm-sync-expert](../crm-sync-expert/SKILL.md)
- "Re-score this list weekly" → [scheduled-workflow](../scheduled-workflow/SKILL.md)

Always offer the first two — they're the natural next actions.

## Anti-patterns

- Scoring a list you haven't enriched. You'll get 0s on three dimensions and the ranking is useless.
- Hiding the `why_*` evidence columns. Users should be able to challenge a score; that requires seeing the signal.
- Double-counting: if `recentlyChangedJobs` gave Timing points, don't also award it to Influence.
- Scoring LinkedIn Sales Nav outputs with a one-size ICP. Weight dimensions to the offer — e.g. Influence matters more when selling to exec buyers than when selling to end-user ICs.
- Acting on score without a reachability floor — the #1 scored lead with `email_status: not_found` is unactionable. Filter for reachability > 8 before surfacing as "Priority 1".
- Re-scoring without new enrichment. Scores are a function of signals; if signals didn't change, the score doesn't change — save the compute.

## Customizing the weights

The default weights assume a typical B2B SaaS offer. Users selling into specific segments can override:

- **High-ACV enterprise** → Influence × 1.5, Fit × 1.2. Reachability matters less (AEs can dig).
- **Velocity SMB outbound** → Reachability × 1.5, Timing × 1.2. Influence matters less.
- **Developer tool to ICs** → Influence × 0.5 (ICs buy themselves), Engagement × 1.5.
- **Trigger-driven outbound** (e.g. just-raised startups) → Timing × 2.0.

If the user hasn't said, ask once: "Any weight adjustments, or use the default weighting?"

## Cost

This skill reads upstream data; it doesn't call paid tools itself. If data gaps require enrichment to score accurately, this skill surfaces the gaps but hands off to [enrich-and-verify](../enrich-and-verify/SKILL.md) for the actual spending.
