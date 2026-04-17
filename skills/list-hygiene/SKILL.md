---
name: list-hygiene
version: 1.0.0
description: |
  Cleans a raw contact list before outreach — deduplicates, normalizes names/phones/
  companies, classifies emails (work/personal/role/disposable), verifies deliverability,
  and flags risky entries. Uses cheap local utilities first (normalize_*, identify_email_type)
  before any paid verification. Use when the user has a list and says "clean it", "prep
  it for send", "dedupe", or "verify before campaign".
benefits-from: [texau-gtm, enrich-and-verify, crm-export]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - clean this list
  - dedupe
  - prep for send
  - verify before campaign
  - classify these emails
  - normalize this data
---

# list-hygiene

Turn a messy list into a campaign-ready one. **Cheap local operations first; paid verification last.**

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## The pipeline

Five steps, run in order. Stop between any two if the list is good enough for the user's purpose.

### 1. Audit — free

Count and report:
- Total rows
- Blank emails
- Blank names
- Probable duplicates (same email, same linkedinUrl, same name+company)

Show the user this audit before spending any credits. They may ask to stop here.

### 2. Normalize — ~0.5 credits per field per row

Run local utility tools (0.5 credits each, free-ish):

| Field | Tool | What it does |
|---|---|---|
| Emails | `extract_urls_emails` on free-text rows; else `remove_whitespace` | Trim, lowercase, strip mailto: |
| Phones | `normalize_phone` | → E.164 (`+14155551234`) |
| Company names | `normalize_company` | Strip Inc./LLC/Ltd, canonical form |
| Domains | `clean_domain` | Strip protocol/www/trailing slash |
| Free-text lists (tags, titles) | `normalize_list` | Dedupe + trim |

**Rule:** Only call a normalizer on the rows that need it. Don't send 1,000 clean rows through `remove_whitespace` — it's a waste even at 0.5 credits each.

### 3. Dedupe — free (local)

Logic, in priority order:
1. Exact same **email** (case-insensitive) → merge, keep richer row.
2. Same **linkedinUrl** → merge.
3. Same **firstName + lastName + companyDomain** → probable dupe; flag for user review.

Show dupe count; ask before auto-merging any Tier 3 (fuzzy) matches.

### 4. Classify emails — `identify_email_type` (0.5 credits each)

Returns one of: `work` / `personal` / `role` / `disposable` / `unknown`.

**Action by class:**
- `work` → keep
- `personal` (gmail/yahoo/outlook.com) → keep but flag (lower deliverability, different tone)
- `role` (info@, sales@) → drop unless user explicitly wants general-box
- `disposable` (10minutemail, guerrillamail) → drop always

**Cost gate:** at 0.5 each, 1000 rows = 500 credits. If list >200, confirm before running.

### 5. Verify deliverability — `verify_emails` batch (0.5 credits each)

Only run this if the user is about to send a campaign. Otherwise skip.

- Submit up to 1000 per `verify_emails` job → get `jobId`.
- Poll `check_email_verification` (free).
- Return status counts.

**Decision matrix — what to keep:**

| Verifier status | Recommended action |
|---|---|
| `valid` | Keep — safe to send |
| `risky` (catch-all) | Keep with throttle: low-volume, no sales-y subject lines |
| `invalid` | Drop |
| `unknown` | Re-verify in 24h or drop (user's call) |

## Output

Return three artifacts:

1. **Summary block:**
   ```
   Input: 847 rows
   Normalized: 847 rows (142 cleaned)
   Dedupe: 61 removed (17 exact email, 22 same LI URL, 22 fuzzy-confirmed)
   Classify: 708 work, 56 personal, 18 role (dropped), 4 disposable (dropped)
   Verify: 684 valid, 22 risky, 2 invalid
   Ready to send: 706 rows (684 valid + 22 risky flagged)
   Total credits spent: 734
   ```

2. **The clean list** (JSON or CSV per user preference).

3. **The dropped list** with reasons (for audit/restore).

## Cost ceiling

Full pipeline for a 1000-row list ≈ **1500 credits** (500 classify + 500 verify + 500 for normalization on subset). Always quote this upfront.

For most users: they only need steps 1–3 (free) + step 5 on valids-only from step 4. Offer that as the default path.

## Anti-patterns

- **Don't** verify then classify — verify after classify. Classifying first drops disposables/roles cheaply (0.5 ea) before paying 0.5 each to verify undeliverable junk.
- **Don't** re-run hygiene on a list that was cleaned <7 days ago unless the user says so.
- **Don't** call `email_verifier` (waterfall, sync) in a loop for a list >10. Use `verify_emails` batch.
- **Don't** silently drop `personal` emails — some users *want* personal emails (recruiting, creator outreach).

## Follow-ups

After hygiene:
- "Push to HubSpot / Salesforce / CSV? → [crm-export](../crm-export/SKILL.md)"
- "Want more LinkedIn prospects to add to this list? → [build-prospect-list](../build-prospect-list/SKILL.md)"

## Offer to schedule this

> "If you send campaigns weekly, I can run this hygiene pipeline every Friday at 16:00 on whatever list you have queued, so Monday sends go out clean. → [scheduled-workflow](../scheduled-workflow/SKILL.md)."

Pre-campaign scheduled hygiene keeps bounce rates below the 3% threshold that triggers ESP throttling.
