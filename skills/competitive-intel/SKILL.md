---
name: competitive-intel
version: 1.0.0
description: |
  Competitive intelligence on one or more companies — paid ads, organic post activity,
  tech stack, tracking pixels, social footprint, and hiring signals. Compares multiple
  competitors side-by-side when asked. Uses ad_search, website_intelligence, web_tech_stack,
  post_keyword_search, and profile_activities on key executives. Proactively invoke on
  "what ads is X running", "compare X vs Y", "what tech does X use", "competitive scan".
benefits-from: [texau-gtm, account-research]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - what ads is X running
  - compare X vs Y
  - what tech does X use
  - competitive scan
  - competitive intel
  - look at their landing page
---

# competitive-intel

Quick, comparable, evidence-based snapshots of competitors.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — define the question

Ask if unclear — the cost varies 10× by angle:

| The user really wants to know… | Use |
|---|---|
| "What ads are they running?" | `ad_search` + `ad_details` |
| "What's their tech stack?" | `web_tech_stack` (cheap) or `website_intelligence` (comprehensive) |
| "What are they posting about?" | `post_keyword_search` with `fromCompany` |
| "Who are their thought leaders?" | `enrich_profile` + `profile_activities` on 2-3 named execs |
| "How do we stack up vs them?" | **Full compare mode** — run a narrow version of all the above on each side |

## Phase 1 — ad intelligence

`ad_search` (0.2/result) scoped to the target company. You can:
- Pass `advertiser: "<Company>"` or LinkedIn Ad Library URL
- Add `dateRange` to scope to last 30/90 days
- Add `country` if geo-specific

After getting the list, run `ad_details` (2 credits each) on the **top 2-3** most interesting ads only — don't burn credits on every ad.

### What to extract

- **Creative angles**: what pains / promises / CTAs do the ads emphasize?
- **Audience signals**: targeting breakdown (if available) — industries, titles, seniority
- **Cadence**: how often they launch new creatives (churn rate signal)
- **Channels**: image vs video vs carousel share

## Phase 2 — tech stack + GTM signals

For a fast read: `web_tech_stack` (2 credits) on their marketing site.

For the full picture: `website_intelligence` (5 credits) — one call, all of:
- Tech stack (100+ detectors)
- Pixels / analytics (Meta, LinkedIn, TikTok, etc. — reveals ad spend channels)
- Social profile links
- Emails on the site
- SSL / domain metadata

**Rule:** If the user wants >2 companies, `website_intelligence` is almost always the right call. Running tech_stack + pixels + social_links separately costs 2+1+2 = 5 anyway, and loses the aggregated view.

### Interpreting pixels → GTM playbook

| Pixel seen | Implies |
|---|---|
| LinkedIn Insight Tag | Running LinkedIn Ads — high-intent B2B |
| Meta Pixel + Google Ads + TikTok | Multi-channel paid acquisition (DTC or SaaS-wide) |
| HubSpot / Marketo / Pardot | Running marketing automation → organized demand gen |
| Segment | Data-mature — tracks events to multiple downstream tools |
| Intercom / Drift / Zendesk | Support ops maturity |
| Cal.com / Calendly / Chili Piper | Sales booking flow (meeting-driven) |

## Phase 3 — content activity

Last 30d posts from the company page: `post_keyword_search` with `{ fromCompany: "<companyUrn>", datePosted: "past-month" }` (6 credits).

**Ask before running — 6 credits is the biggest single line item here.**

Extract themes:
- Product-led (feature launches, tutorials)
- Thought-leadership (opinions, research)
- Employer-brand (hiring, culture)
- Customer-led (case studies, testimonials)

## Phase 4 — exec voice (optional)

For 1-3 named executives: `enrich_profile` + `profile_activities` (POST only).

Cost: 1 + 2 = 3 credits each. Cap at 3 execs = 9 credits.

What this tells you:
- Where they're consciously positioning themselves
- What they openly dislike about competitors (pay attention — they often name names)
- What customers they're engaging with publicly

## Phase 5 — compare-mode synthesis

When comparing 2+ companies, output a **side-by-side grid**:

```
                      Acme Corp            Beta Industries
Size (LinkedIn)       501-1000             201-500
Ad cadence (30d)      12 new creatives     3 new creatives
Ad angle              "Save time"           "Save money"
Pixels                LI + Meta + HubSpot   LI only
Tech maturity         Enterprise            Scrappy
Company posts (30d)   21 (product-led)      8 (thought-leadership)
Top exec voice        CEO — thought lead    CMO — product demos
Inferred strategy     Demand gen at scale   Founder-led, narrower ICP
```

Then a 2-3 sentence **what-this-means** interpretation for the user.

## Cost ceiling

Sensible defaults per company:
- **Light scan** (ads + tech only): ~10 credits
- **Standard compare**: website_intelligence (5) + 5 ad_details (10) + company posts (6) = ~21 credits per company
- **Deep dive**: add exec voice (9) + fuller ad sweep = ~35 credits per company

State the bill before running. For compare mode with 3+ companies, always confirm.

## Anti-patterns

- **Don't** run `ad_details` on every ad — top 3-5 only.
- **Don't** interpret tech stack without seeing the site — pixels can be stale.
- **Don't** compare companies on metrics that vary by company-size (total posts, total employees) — normalize by headcount.
- **Don't** make claims about strategy you can't point at (ad, post, hire) as evidence. Always cite.

## Follow-ups

- "Want to find decision makers at [winner of the comparison]? → [account-research](../account-research/SKILL.md)"
- "Want to build a prospect list that looks like their customers? → [build-prospect-list](../build-prospect-list/SKILL.md)"

## Offer to schedule this

> "Want this as a weekly intel report? Every Monday I can re-pull ads + posts + tech signals for these competitors and email you the diff vs last week. → [scheduled-workflow](../scheduled-workflow/SKILL.md)."

Weekly competitor diffs catch campaign launches and positioning shifts within a week — any slower and the intel is a history lesson.
