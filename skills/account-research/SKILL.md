---
name: account-research
version: 1.0.0
description: |
  Builds a multi-angle profile of a target company — firmographics, decision makers,
  tech stack, recent posts, and ad spend — by orchestrating enrich_company, lead_search
  (scoped to that company), web_tech_stack, post_keyword_search, and ad_search. Use when
  the user wants intelligence on a specific account before outreach, mapping, or a meeting.
  Proactively invoke on "research Acme", "who should I talk to at X", "tell me about
  <company>", "account mapping", "decision makers at <company>".
benefits-from: [texau-gtm, competitive-intel, pre-meeting-briefing]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - AskUserQuestion
triggers:
  - research <company>
  - who should I talk to at
  - tell me about <company>
  - account mapping
  - decision makers at
---

# account-research

Everything the user needs to know about a target company in one orchestrated pass.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — resolve the account

Input varieties:
- LinkedIn company URL → use directly with `enrich_company`
- Company name only → run `clean_domain` (0.5 credits) to get domain, then `enrich_company`
- Domain only → `enrich_company` (it accepts either)

If ambiguous (e.g. "Acme" could be 10 different companies), ask which domain/URL.

## Phase 1 — firmographic baseline

Call `enrich_company` (1 credit). Extract:
- Employee count, headcount band, industries
- HQ location, founded year
- Website, LinkedIn URL, company ID
- Specialties, description

Stop and confirm the company match before spending more credits.

## Phase 2 — pick research depth

Ask the user — or infer from the prompt — which angles they need:

| Angle | Tool | Cost | When to run |
|---|---|---|---|
| **Decision makers** | `lead_search` scoped to this company | 0.5 / result × ~15 results ≈ 7.5 | Always, unless explicitly told not to |
| **Tech stack / GTM signals** | `web_tech_stack` | 2 | When the user sells to eng/IT or wants GTM intent signals |
| **All-in-one site report** | `website_intelligence` | 5 | When the user wants "the full picture" — replaces tech_stack + pixels + social + emails |
| **Recent posts** | `post_keyword_search` with `fromCompany` | 6 | When the user cares about positioning / recent announcements |
| **Ad activity** | `ad_search` filtered to this company | 0.2 / result | When the user wants marketing / GTM intel |
| **Web emails** | `web_emails` | 3 | Only if direct contacts via email are desired (privacy-sensitive — confirm) |

**Default depth** (no ask): Firmographic + Decision makers. Anything else → ask.

## Phase 3 — decision-maker mapping

This is the core GTM output. Use `lead_search` with:

```json
{
  "currentCompanies": ["<company URL or name>"],
  "seniority": ["Director", "Vice President", "CXO", "Owner / Partner"],
  "page": 1
}
```

Override the seniority band only if the user specifies (e.g. "I need individual contributors" → drop seniority). If the user wants a specific function:

```json
{ "functions": ["Sales"] }  // or Engineering, Marketing, Product, etc.
```

Stop at 25 results (1 page = 12.5 credits). If user wants more, paginate with `sessionId`.

### Present as an org map

Group results by function, then by seniority within each function:

```
Engineering
  ├─ CTO / VP Eng
  │    • Jane Smith — CTO (8yr tenure) — linkedin.com/in/…
  │    • John Liu — VP Engineering (2yr) — linkedin.com/in/…
  └─ Director of Engineering
       • Alex Chen — Director, Platform (1yr) — linkedin.com/in/…
Sales
  ├─ CRO / VP Sales
  │    • Maria Kim — VP of Sales (3yr) — linkedin.com/in/…
…
```

This is the highest-leverage output — the user should be able to pick their target in 5 seconds.

## Phase 4 — optional deeper angles

If the user requested tech stack / posts / ads, run those in **parallel** (one tool call message, multiple tools). Report each as a separate section.

### Tech stack interpretation

`web_tech_stack` returns category-grouped tech. Highlight:
- **Marketing stack** (HubSpot, Marketo, Pardot) → implies their GTM maturity
- **Analytics** (Segment, Amplitude, Mixpanel) → data-driven culture
- **CRM** (Salesforce, HubSpot, Pipedrive) → integration paths
- **Cloud + dev infra** (AWS/GCP, Vercel, Cloudflare) → relevant if you sell dev tools
- **Security / compliance** (Okta, Auth0) → enterprise signals

### Post / ad signals

- Look for "we're hiring", "just raised", product launches → buying-signal timing.
- `post_keyword_search` with `fromCompany: <urn>` pulls company-page posts; for founder/CEO thought leadership, use `profile_activities` on the CEO's URN instead.

## Phase 5 — synthesize

End with a **briefing block**, not a wall of JSON:

```
Acme Corp — snapshot
  Industry: Financial Services  |  Size: 501-1000  |  HQ: New York, NY
  Stack signals: HubSpot + Segment + AWS + Okta → enterprise-grade, growth-stage
  Hiring signals: 12 open eng roles in last 30d → likely scaling platform team

Top decision makers to target
  • Jane Smith — CTO — 8yr tenure, recently posted on platform migration
  • Maria Kim — VP Sales — new to the role (3mo), likely evaluating vendors
  • Alex Chen — Director of Platform — owns cloud budget, active on LinkedIn

Recommended next step
  → enrich-and-verify on these 3 → compose outreach → track in CRM
```

## Cost ceiling

Default total ≤ 15 credits (enrich_company 1 + lead_search 12.5 + web_tech_stack 2 if asked ≈ 15).

If the user wants the full `website_intelligence` + posts + ads sweep, estimate and confirm (typically 30–50 credits for a complete picture).

## Follow-up hooks

After the briefing:
- "Want me to find emails for [Jane, Maria, Alex]? → [enrich-and-verify](../enrich-and-verify/SKILL.md)"
- "Want pre-meeting prep on one of them? → [pre-meeting-briefing](../pre-meeting-briefing/SKILL.md)"
- "Want to compare against a competitor? → [competitive-intel](../competitive-intel/SKILL.md)"

## Offer to schedule this

For target-account lists (the user's named ABM list, not one-off research):

> "Is this a tier-1 named account? Want me to refresh this monthly so new decision makers + post activity land in your CRM automatically? → [scheduled-workflow](../scheduled-workflow/SKILL.md)."

Monthly is the sweet spot for named accounts — firmographic changes don't move weekly, and nothing drifts fast enough to warrant higher frequency.
