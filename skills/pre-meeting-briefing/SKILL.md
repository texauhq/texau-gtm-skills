---
name: pre-meeting-briefing
version: 1.0.0
description: |
  Produces a one-page briefing on a person before a sales call, interview, or meeting.
  Chains enrich_profile + profile_activities (posts, comments, reactions) + enrich_company
  for context. Optionally adds post_details on their top-engaged posts. Use when the user
  has a meeting, call, or interview coming up with a named person or LinkedIn profile.
  Proactively invoke on "prep me for my meeting", "brief me on <name>", "call with X tomorrow".
benefits-from: [texau-gtm, account-research]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - prep me for my meeting
  - brief me on
  - call with X tomorrow
  - pre-meeting
  - who is this person
---

# pre-meeting-briefing

Turn a LinkedIn URL + 90 seconds into "I know enough to have a credible conversation."

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — inputs

Needed:
- LinkedIn profile URL (ask if missing — do *not* run name-based search without confirmation; too easy to brief the wrong person)
- Meeting context (optional but highly valuable): "intro call", "interview", "partnership", "board prep"

Optional:
- Company LinkedIn URL (if user hasn't provided, derive from the profile's `currentPositions[0]`)

## Phase 1 — person enrichment

`enrich_profile` (1 credit) → capture:
- Name, headline, current position + tenure
- `entityUrn` (needed for Phase 2)
- Past positions (last 3 — older is rarely relevant)
- Education
- Location
- Summary / about text

Stop and confirm with the user if the enriched person doesn't match their expectation (photo, headline). Saves credits on wrong-target research.

## Phase 2 — recent activity

This is the **differentiated** part of a briefing. Pull one at a time:

### Posts they authored — `profile_activities` with `type: "POST"`

- Cost: 2 credits
- Default `size: 10`
- Returns their 10 most recent posts → commentary, engagement, time

### Comments they made — `profile_activities` with `type: "COMMENT"`

- Same cost. Reveals who they're talking to and what they're reacting to publicly.
- Often more revealing than their own posts.

### Reactions — `profile_activities` with `type: "REACTION"`

- Same cost. Lowest signal-to-noise, but sometimes surfaces interests.

**Default:** Run POST + COMMENT only (4 credits). Skip REACTION unless the user asks.

## Phase 3 — optional company context

If `enrich_company` on the person's current employer hasn't been run in this session yet, run it (1 credit). Pull:
- Company size, industry, HQ
- Recent company-page posts via `post_keyword_search { fromCompany: <companyUrn> }` (6 credits — **ask first**, this is the biggest line item)

## Phase 4 — synthesize the briefing

Output format — exactly this structure, tight writing, no fluff:

```
BRIEFING: <Name>, <Title> at <Company>
Meeting context: <whatever the user said, or "unknown">

THE PERSON
  Current role: <title>, <tenure> — <1-line interpretation of seniority>
  Background: <most relevant prior role(s) for the meeting context>
  Location: <city/region>

THEIR RECENT VOICE (last 30 days)
  • Posted: <1-line summary of most-engaged post, + engagement count>
  • Posted: <second-most-engaged>
  • Commented: <on whose post + 1-line gist, if notable>

SIGNALS & HOOKS
  • <Any hiring, fundraising, product, or transition signal>
  • <A shared connection, common employer, school, or city if evident>
  • <An opinion they've expressed publicly that relates to your meeting>

RECOMMENDED OPENING
  <1–2 sentences — a specific, honest opener that references something real>

RISK / WATCH-OUTS
  <If they recently posted about a bad vendor experience, a frustration, or a
   transition, flag it. If they're clearly hostile to your category, say so.>
```

## Phase 5 — cost transparency

Typical spend:
- Minimal: `enrich_profile` + POST activity = 3 credits
- Default: + COMMENT activity = 5 credits
- Deep: + `enrich_company` + company posts = 12 credits

State the spend at the end. If >10 credits planned, confirm first.

## Anti-patterns

- **Don't** pull their full post history — 10 posts is enough.
- **Don't** quote post text verbatim at length — summarize in one line. Long quotes bloat the briefing.
- **Don't** speculate about personality — stick to behavior you can point at.
- **Don't** run `post_details` on every post — only on the top 1-2 if depth is needed (user must ask; it's +1 credit each).

## When to escalate to `account-research`

If the user's real intent is "I need to understand this account and its buying committee" (not just this one person), stop and offer to switch: "This is really an account-research job — want me to map the decision makers at <Company>? That's a different skill."

## Offer to schedule this

After any one-off briefing:

> "If you run meetings back-to-back, I can brief you every morning on everyone on your calendar that day. → [scheduled-workflow](../scheduled-workflow/SKILL.md) with a daily 06:00 cadence."

Calendar-driven daily briefings are one of the highest-ROI patterns in this pack — the user gets a prepared conversation for every meeting without thinking about it.
