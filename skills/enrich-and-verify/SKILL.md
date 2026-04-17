---
name: enrich-and-verify
version: 1.0.0
description: |
  Chains LinkedIn profile enrichment → professional email finding → deliverability
  verification using the cheapest capable tool at each hop. Handles both single-record
  (waterfall, sync) and batch (async job + polling) paths. Use when the user has one or
  more LinkedIn profile URLs or names and wants contact data attached. Proactively invoke
  on "enrich this profile", "find their email", "verify these emails", "hydrate this list".
benefits-from: [texau-gtm, build-prospect-list, list-hygiene]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - enrich this profile
  - find their email
  - verify these emails
  - hydrate my list
  - profile + email
  - contact data
---

# enrich-and-verify

Three hops, one skill. **Enrich → Find → Verify**. Pick the right batch mode and the right tool at each hop.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

Block on `CATALOG_OK: no`.

## Hop 1 — Enrich

Input: LinkedIn profile URL(s) or LinkedIn URN(s).

| Input shape | Tool | Cost | Why |
|---|---|---|---|
| 1 profile | `enrich_profile` | 1 credit | Synchronous, simplest path. |
| 2–50 profiles | `enrich_profiles_bulk` | 1 credit / result | One API round trip for up to 50; enormously faster than looping `enrich_profile`. |
| >50 profiles | Chunk into batches of 50; call `enrich_profiles_bulk` per chunk | 1/result | Always chunk — never loop singletons. |

**What you get back:** name, headline, current position, company, entity URN (needed for Hop 2), location, summary.

**Rule:** If the user's list contains the same profile twice, dedupe *before* the call. Never pay twice for the same URN.

## Hop 2 — Find email

Two routes. Pick based on list size.

### Route A — Single / small (≤5) → `email_finder` (waterfall, sync)

- Cost: **≤2 credits per success**, 1 on soft-fail, **0 on hard-fail** (all providers unreachable).
- Input: name + company domain (or LinkedIn URL if you didn't enrich first).
- Returns the email immediately. No polling.

### Route B — Batch (10+) → `find_emails` + `check_email_finding`

- Cost: **2 credits per person found** (not per person submitted).
- Up to **100 people per job**.
- Async: submit → get `jobId` → poll `check_email_finding` with that `jobId`.
- Polling cadence: 3s → 5s → 10s → 20s backoff. Cap at 5 min wall-clock; if not done, surface a "check back later" message with the `jobId`.
- `check_email_finding` is **free** — poll as often as you like.

### When to pick which

| Situation | Choice | Reason |
|---|---|---|
| You just enriched 3 profiles | Route A (single calls) | Latency per result < 2s; batch overhead not worth it. |
| You just built a 50-lead prospect list | Route B | 10× faster wall-clock + identical unit cost. |
| Scattered across an hour | Route B even for 5 | Batch deduplication means retries don't double-charge. |

### What you need to feed it

`find_emails` wants one of:
- `{ linkedinUrl }` (cheapest — single source of truth)
- `{ firstName, lastName, companyDomain }` (fallback when no LI URL)
- `{ fullName, companyName }` (last resort — lower hit rate)

If you only have a company *name* (not domain), run `clean_domain` first (0.5 credits) to normalize to a usable domain.

## Hop 3 — Verify deliverability

**Skip Hop 3 unless the user is about to send emails.** Verification is cheap but not free, and `find_emails` already returns a confidence score. Ask: "Do you want me to verify deliverability before you send? It's 0.5 credits per email."

Two routes, same branching logic as Hop 2.

### Route A — Single → `email_verifier` (waterfall, sync)

- Cost: **≤1 credit per verified**, 0.5 on soft-fail, 0 on hard-fail.
- Returns: `valid` / `invalid` / `risky` / `unknown` + deliverability score.

### Route B — Batch → `verify_emails` + `check_email_verification`

- Cost: **0.5 credit per email** (whether valid or not).
- Up to **1000 emails per job**.
- Async same as Hop 2 — submit, poll, free polling.

### Interpreting results

| Status | Action |
|---|---|
| `valid` | Safe to send |
| `risky` / `catch-all` | Send with caution; mark in CRM |
| `invalid` | Drop from send list; do not retry |
| `unknown` | Re-verify in 24h (inbox may be transient) |

## Full chain — when to fire all three hops

If the user says "build a list and get me the verified emails":

1. Route to [build-prospect-list](../build-prospect-list/SKILL.md) first.
2. Once you have `elements[]`, chain: Hop 1 → Hop 2 Route B → Hop 3 Route B.
3. Cost report at the end: `list_credits + enrichment_credits + find_credits + verify_credits`.

## Cost guardrails

Before any hop that will spend >20 credits, stop and confirm. Use `AskUserQuestion`:

> Next step will cost ~N credits (find emails for M people). Proceed?
> A) Yes, go
> B) Change plan
> C) Skip this hop

## Error handling

| Error | Cause | Fix |
|---|---|---|
| `find_emails` job stuck `processing` >5min | Provider latency | Return `jobId`; tell user to rerun `check_email_finding` later. |
| `email_finder` returns "all providers unreachable" | Waterfall hard-fail | Not billed. Try again in 60s, then give up gracefully. |
| Verifier says `risky` for a work email | Catch-all domain | Not a bug — note in output. |
| Duplicate entries in enrichment output | User list had duplicates | Dedupe and surface: "I removed N duplicates before spending credits." |

## Output shape

Return a unified record per person:

```json
{
  "linkedinUrl": "...",
  "firstName": "...",
  "lastName": "...",
  "currentCompany": "...",
  "currentTitle": "...",
  "email": "...",
  "email_status": "valid|risky|invalid|unknown|not_found",
  "email_confidence": 0.92,
  "_credits_spent": { "enrich": 1, "find": 2, "verify": 0.5 }
}
```

Then offer the next step: "Want me to push this into HubSpot/Salesforce/CSV? → [crm-export](../crm-export/SKILL.md)".

## Offer to schedule this

If the user is doing ongoing outbound, ask:

> "Want me to run this enrichment nightly against new CRM contacts only? → [scheduled-workflow](../scheduled-workflow/SKILL.md). I'll set a monthly credit ceiling so it can't run away."

Nightly enrichment-on-new-records-only is the cheapest way to keep a CRM hydrated without re-paying for records you already enriched.

## Anti-patterns to refuse

- **Don't** loop `email_finder` across 50 people — use `find_emails` batch.
- **Don't** verify emails you haven't asked the user about — always confirm Hop 3.
- **Don't** call `enrich_profile` in a loop — use `enrich_profiles_bulk`.
- **Don't** poll `check_email_finding` at <3s intervals — it wastes turns; the job is still queued.
