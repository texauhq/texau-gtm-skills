---
name: sequence-builder
version: 1.0.0
description: |
  Turns an outreach brief + target segment into a ready-to-paste cold sequence for
  Lemlist, Smartlead, Instantly, Reply.io, Woodpecker, or Apollo sequences. Produces
  day-by-day steps with subject lines, bodies, merge-tag syntax correct for the chosen
  tool, A/B variants on the hero step, and a cost estimate at the list level. Pairs
  with outreach-expert (strategy) and crm-sync-expert (delivery). Proactively invoke
  on "write a sequence for this list", "build a cold email campaign", "give me a
  Lemlist sequence", "generate variants", or after build-prospect-list when the user
  mentions sending.
benefits-from: [texau-gtm, outreach-expert, build-prospect-list, enrich-and-verify, list-hygiene, crm-sync-expert, scheduled-workflow]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - write a sequence
  - build a cold campaign
  - Lemlist sequence
  - Smartlead sequence
  - Instantly sequence
  - Reply.io sequence
  - generate variants
  - cold email copy
---

# sequence-builder

Outputs a complete, paste-ready cold sequence for one sending tool. Not a copywriter — a *playbook executor* that takes the strategic decisions (segment, pain, proof, tool) and produces every field the tool needs.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — gather the brief

Ask these in one `AskUserQuestion` batch — don't drip them out. Required:

| Slot | Example |
|---|---|
| **Sending tool** | Lemlist / Smartlead / Instantly / Reply.io / Woodpecker / Apollo |
| **Target segment** | "VP Sales at 200-500 SaaS in NYC / SF" |
| **Pain / trigger** | "Spending too many manual hours on LinkedIn prospecting" |
| **Offer** | "A Claude skill pack that turns the TexAu MCP into opinionated GTM workflows" |
| **Proof asset** | Case study, data point, logo, or customer quote — one thing |
| **CTA style** | Soft ask ("worth a 10-min call?") / hard ask ("15 min Thursday?") / value-first ("here's a free tool") |
| **Personalization depth** | L0 firstName only / L1 company hook / L2 dynamic image / L3 hand-researched |
| **Sequence length** | 2 steps (high-ICP only) / 4 steps (default) / 6 steps (warm lists) |
| **Language + timezone** | "English, US East" |

Optional:
- Sender persona (founder vs SDR — the copy voice differs a lot)
- Brand voice samples to match
- Any hard no-go words (industry-sensitive)

If the user skipped `outreach-expert` first, flag it: "I can build this now, but if you haven't decided on sending tool / cadence / deliverability setup, `outreach-expert` is worth 5 minutes first."

## Phase 1 — skeleton structure

Default 4-step cold sequence. Adjust step count based on the brief.

```
Step 1  Day 0   Intro + hook + one-sentence why + soft CTA
Step 2  Day 3-4 Value-add: a resource, stat, or question that proves relevance
Step 3  Day 7-8 Social proof: customer quote, case-study snippet, or logo cluster
Step 4  Day 12-14 Break-up: "Should I stop following up?"
```

Send-time defaults per step: **Tue-Thu, 08:30-10:30 recipient-local**. Tool-specific schedulers take this automatically.

## Phase 2 — copy — the templates

### Step 1 rules

- ≤ 100 words
- One CTA
- No image, no tracking pixel on step 1 (deliverability)
- Subject line: 3-5 words, lowercase, no brackets, no emoji
- Personalization slot: first line is always specific to *them*

### Step 1 template

```
Subject: {{personalized_subject}}

Hi {{firstName | "there"}},

{{first_line_personalization — one sentence that proves this isn't templated to 10k people}}

{{value_prop — one sentence specific to their segment}}

{{soft_CTA — a question, not a demand}}

— {{senderFirstName}}
```

Where the slots come from:
- `personalized_subject`: pick from ≤5 variants, tested weekly; keep hero + 2 A/B variants below
- `first_line_personalization`: a recent event (job change, post, hire, fundraise) — [account-research](../account-research/SKILL.md) and [evidence-score](../evidence-score/SKILL.md) surface these signals
- `value_prop`: specific to segment, never to the individual
- `soft_CTA`: "Worth a 10-min look?" beats "Can we hop on a call Thursday at 2?"

### Step 2 template

```
Subject: re: {{step_1_subject}}

Hi {{firstName | "there"}},

{{bridge — one sentence: "wanted to share something specific to {{company | "your team"}}"}}

{{value_asset — link to a one-page breakdown, a data point, or a quick framework}}

{{light_ask — "Curious if this maps to what you're seeing?"}}

— {{senderFirstName}}
```

### Step 3 template

```
Subject: how {{relatable_peer_company}} used this

Hi {{firstName | "there"}},

{{proof_one_liner — "{{peer_company}} was running into {{their_pain}}. Three weeks in: {{outcome_number}}."}}

{{transition_to_them — "Thought of you because {{company | "your team"}} might have the same shape."}}

{{cta — "15 min next Tuesday? Can send a deeper breakdown first if useful."}}

— {{senderFirstName}}
```

### Step 4 (break-up) template

```
Subject: closing the loop

Hi {{firstName | "there"}},

Haven't heard back — that's fine. Just didn't want to keep showing up uninvited.

If {{offer_summary}} isn't a fit right now, a quick "not now" is all I need and I'll stop.

— {{senderFirstName}}
```

## Phase 3 — subject-line variants

Always produce **hero + 2 variants** on the step-1 subject. Label them for the user to A/B.

Example (SaaS Directors+ pain = manual prospecting):
- Hero: `quick sanity check`
- Variant A: `3 hours back for your SDRs`
- Variant B: `re: your stack`

Rules:
- None longer than 40 chars
- No `!`, no `[brackets]`, no capitalized hooks
- Don't repeat company names already in the "From" line
- `re:` outperforms fresh subjects — use where honest (reply continuity)

## Phase 4 — tool-specific export

Emit the sequence in the syntax of the user's chosen sending tool. Pick the right one.

### Lemlist

Uses **Liquid-like syntax** for variables + a special `{{icebreaker}}` field for first-line personalization.

```liquid
Subject: {{subject_line}}

Hi {{firstName | default: "there"}},

{{icebreaker}}

We help {{companyType | default: "teams like yours"}} {{valueProp}}.

{{cta}}

— {{senderFirstName}}
```

Lemlist has an "AI icebreaker" feature; for L1/L2 personalization depth, you can populate `icebreaker` upstream (per-lead in the CSV) or let Lemlist's AI generate it from a prompt.

### Smartlead

Uses **spintax** for random variation + standard merge tags.

```
Subject: {{subject_spin | "{quick sanity check|re: your stack|3 hours back for your SDRs}"}}

Hi {{first_name}},

{intro_variant | "Saw|Came across|Noticed"} {{company}} just {{recent_event}}.

{{value_prop}}

{cta_variant | "Worth 10 min?|Would a quick look help?|Open to a call?"}

— {{sender_first_name}}
```

Spintax runs at send time; each recipient gets one deterministic variant.

### Instantly

Standard `{{variable}}` merge tags. Supports custom fields from the uploaded CSV.

```
Subject: {{subject}}

Hi {{firstName}},

{{customField1_firstLine}}

{{value_prop_static}}

{{cta_static}}

— {{sender}}
```

Instantly is cleanest when you **pre-compute** first-line personalization upstream and attach it as a custom field on the CSV.

### Reply.io

Supports merge tags + conditional blocks. Multi-channel tool — sequence includes LinkedIn / email / call steps.

```
Subject: {{Subject}}

Hi {{FirstName}},

{{if CompanySize}}For teams your size, {{/if}}{{ValueProp}}.

{{CTA}}

— {{Sender.FirstName}}
```

Conditionals help for segmented lists.

### Woodpecker

Standard merge tags. EU-hosted; mind GDPR lawful-basis block if targeting EU.

```
Subject: {{SUBJECT}}

Hi {{FIRST_NAME}},

{{SNIPPET1}}

{{CTA}}

— {{FROM_FIRST_NAME}}
```

Uses ALL_CAPS tokens — distinct from the others.

### Apollo sequences

Apollo's sequence tool uses `{{fieldName}}` matching its own data model (`firstName`, `companyName`, `titleKeyword`). If the user hasn't enriched via Apollo, Apollo won't have fields your CSV filled in — push via their CSV importer first.

## Phase 5 — A/B testing plan

If the user wants multivariate testing:

- **A/B only step 1.** Steps 2-4 carry follow-up logic; testing them is noise on small lists.
- Minimum **200 sends per variant** before declaring a winner. Below that, you're reading noise.
- Test **one variable at a time**: subject, OR first-line, OR CTA. Never two.
- Hero metric: **positive reply rate**. Not opens (post-MPP they're garbage — see [outreach-expert](../outreach-expert/SKILL.md)).

## Phase 6 — cost math at the list level

Before exporting, give the user a line-item cost forecast. The list needs to be through `build-prospect-list` + `enrich-and-verify` + `list-hygiene` before sending.

```
List size:            500 leads
Data pipeline cost:
  build-prospect-list (lead_search, 20 pages) : 250 credits
  enrich-and-verify   (bulk enrich + emails)  : 800 credits (approx, 70% hit)
  list-hygiene        (classify + verify)     : 250 credits
Data total:                                     ~1300 credits

Sending tool cost:     per-seat subscription — not TexAu credits
```

Make this clear — TexAu credits are for *data*; the sending tool charges separately per seat. Don't conflate the two.

## Phase 7 — scheduling the campaign launch

After producing the sequence, offer:

> Want me to schedule this as a recurring ICP refresh? Every Monday 05:00, pull 100 fresh leads matching your ICP through the full data pipeline, and drop the CSV ready-to-import into your sending tool. → [scheduled-workflow](../scheduled-workflow/SKILL.md)

Most cold sequences run on a *new-leads-per-week* cadence. The sequence copy is static; the list is what needs refreshing. Scheduling this loop is the unlock.

## Phase 8 — output structure

Deliver in one message, in this order:

1. **One-line summary**: "4-step sequence for <segment>, for <tool>, CTA-style: <style>."
2. **Hero + 2 variants** for step-1 subject.
3. **Full copy** for steps 1-4 in the chosen tool's native syntax.
4. **List of required custom fields / merge tags** the user must have on their CSV.
5. **Cost forecast** at the list level.
6. **Scheduling offer** (always).

If the user asked for the response as a file, write to `./sequences/<segment-slug>-<tool>.md` (creating `./sequences/` if absent).

## Anti-patterns

- Writing copy longer than 100 words in step 1. 50-80 is the sweet spot.
- Putting the proof in step 1. Prove relevance first; proof comes in step 3.
- Using the same CTA ("Are you open to a call?") on every step. Each step shifts the ask shape.
- Offering multiple CTAs in one email. Pick one. Always.
- Adding emoji to subject lines for "pop". It's a spam tell; filter hates it.
- Hard-coding a specific sending day/time instead of "Tue-Thu, 08:30-10:30 recipient-local" — the tool schedulers handle this for you.
- Writing "I hope this email finds you well" — pattern-matched as cold-email spam by humans and filters.
- Using `{{firstName}}` without a default — empty merge in subject = instant trash.
- Testing six variants at 30 sends each. Not significant. Stop.

## Handoff patterns

- "This list needs hygiene before it sends" → [list-hygiene](../list-hygiene/SKILL.md)
- "Push this list into my CRM / sending tool" → [crm-export](../crm-export/SKILL.md) or [crm-sync-expert](../crm-sync-expert/SKILL.md)
- "Run this ICP refresh weekly" → [scheduled-workflow](../scheduled-workflow/SKILL.md)
- "Revisit the strategy — am I even sending this the right way?" → [outreach-expert](../outreach-expert/SKILL.md)
- "Rank the list before send — who should hear from us first?" → [evidence-score](../evidence-score/SKILL.md)

## Cost

This skill doesn't spend TexAu credits. It transforms an already-enriched list into a sequence. All the data spend happened upstream.
