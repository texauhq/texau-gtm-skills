---
name: local-business-prospecting
version: 1.0.0
description: |
  Builds prospect lists of local/hyperlocal businesses (restaurants, dentists, gyms, contractors,
  agencies, retail, clinics — anything with a Google Maps presence) by keyword + location, with
  enrichment of website, phone, email, tech stack, and reputation. Different ICP shape from
  LinkedIn-centric prospecting: queries are "what + where" (e.g. "dentists in Austin"), evidence
  is reviews/ratings/category, outreach is call/SMS/local-targeted email. Proactively invoke on
  phrases like "find all dentists in", "list of restaurants near", "local business list",
  "scrape Google Maps for", "businesses in <city> with <criterion>".
benefits-from: [texau-gtm, list-hygiene, cost-optimizer, crm-export]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - find all <category> in <location>
  - list of <category> near <location>
  - local business list
  - scrape Google Maps for <category>
  - hyperlocal prospects
  - <category> in <city>
  - businesses in <area> with <criterion>
  - local lead list
---

# local-business-prospecting

Build a deduplicated, contact-enriched list of local businesses by category + location. This skill is for **hyperlocal / SMB / brick-and-mortar** sourcing — when the LinkedIn-centric `build-prospect-list` doesn't fit because there are no titles, no industries-as-IDs, just a category and a city.

## Preamble — run first

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

If `CATALOG_OK: no` → stop and run `texau-skills-sync`. Do not guess tool names.

## When to use this skill vs build-prospect-list

| Signal | Use |
|---|---|
| Query has a job title or seniority | `build-prospect-list` |
| Query has a LinkedIn URL or Sales Nav URL | `build-prospect-list` |
| Query is "<category> in <city>" with no people component | **this skill** |
| User wants ratings / reviews / hours / address as evidence | **this skill** |
| User wants website, phone, owner email | **this skill** (then enrich) |

If both apply (e.g. "dentists in Austin AND their office managers on LinkedIn"), run **this skill first** to source accounts, then hand off to `build-prospect-list` with `linkedin_company_employees_search` for the people layer.

## Phase 0 — parse the request

Extract these fields. Ask only for the missing **critical** ones.

| Slot | Example | Required? | Maps to |
|---|---|---|---|
| `category` | `"dentist"`, `"coffee shop"`, `"law firm"` | ✅ yes | `keyword` |
| `location` | `"Austin, TX"`, `"Brooklyn, NY"`, `"94110"` | ✅ yes | `location` |
| `quality_filter` | min rating, min review count, "no website" | optional | post-filter |
| `count_target` | `50`, `200` | optional, default 50 | `max_results` |
| `language` | `"en"`, `"es"` | optional, default en | `language` |
| `existing_maps_url` | a hand-crafted Maps URL | optional | use `google_maps_places_scraper_url` instead |
| `enrich_with` | `["website", "email", "tech", "reviews"]` | optional, see Phase 4 | follow-up tools |

If the user pasted a Google Maps URL with applied filters (zoomed/sorted/category-filtered), **skip Phase 1's keyword path** and use `google_maps_places_scraper_url` instead — it preserves their UI filters.

## Phase 1 — source the place list

Read `_lib/mcp-catalog.json → decision_tree.local_business` for the canonical decision tree. Default path:

- **By keyword + location** → `google_maps_places_scraper` (0.2/place)
- **By Maps URL** → `google_maps_places_scraper_url` (0.2/place)

State the cost out loud before calling:

> "Sourcing up to {{count_target}} {{category}} in {{location}}. Cost: ~{{count_target * 0.2}} credits. OK?"

If `count_target * 0.2 > 20` credits, **gate on `AskUserQuestion`** unless the user pre-authorized. This is the cost-burn protection.

### What you get back

Per place: `name`, `address`, `phone`, `website`, `category`, `rating`, `review_count`, `hours`, `place_id`, `latitude/longitude`, sometimes `email` if surfaced.

## Phase 2 — quality filter (free, in-memory)

Most local-prospect campaigns waste budget on the long tail. Apply local filters BEFORE enrichment:

| Filter | Why |
|---|---|
| `rating >= 4.0` AND `review_count >= 10` | Excludes brand-new/low-traction businesses unless those are the target |
| `rating < 3.5` | **Inverse** — find unhappy local businesses (fertile ground for "we can fix your reviews" pitches) |
| `website == null` | Find businesses without web presence (web-design / SEO agency target) |
| `phone == null` | Excludes shell listings |
| Dedupe on `phone` AND `address` | Multi-location chains list each branch as a separate place |

Always say which filters you applied and how many places remained. Don't silently drop rows.

## Phase 3 — normalize (free / cheap)

Before enrichment:

1. **Phone**: pass each `phone` through `normalize_phone` to E.164 format (~0.5 credits batched, but check catalog for current price). Required for SMS/dialer downstream.
2. **Domain**: extract clean domain from `website` via `clean_domain` (free local function). Strips `www.`, query strings, fragments.
3. **Owner-name guess**: if the place name contains a person ("Dr. Sarah Chen DDS"), split into first/last for use in Phase 4 email finding. If it's a brand name, skip.

## Phase 4 — enrich (opt-in, costed)

ONLY run the enrichments the user actually asked for. Each is independent and costed:

### 4a. Website-less businesses → `find_website_by_company_name` (0.5/call)

For places where `website == null` but the business has a real name. ~50% hit rate; cap to top-N candidates to control cost.

### 4b. Owner / decision-maker email

Two paths, **chained narrowest-first**:

1. **From the website** → `web_emails` (cheap, scrapes contact pages). Often surfaces `info@`, sometimes the owner's direct address.
2. **From owner name + domain** (if Phase 3 split a person name out) → `email_finder` (≤2 credits/success, waterfall). Use ONLY when web_emails returned nothing actionable.

Skip personal-email tools (`find_personal_email`) unless the user explicitly opted in — most local outreach uses the business address, not personal email.

### 4c. Tech stack → `web_tech_stack` (1/call)

Run only when the prospecting hook depends on tech (e.g. "find restaurants on Toast", "agencies running WordPress"). Otherwise skip — adds noise.

### 4d. Review mining (VoC) → `google_maps_reviews_scraper` (0.05/review)

Powerful but easy to over-spend on. Caps:

- **Default**: pull `max_reviews: 25` per place — enough for a sentiment summary.
- **Always set `sort: "lowest"` first** — negative reviews are the gold for "we can fix this" outreach hooks. Add a second pass with `sort: "highest"` only if you need a balanced view.
- **Never** call review scraping on the full place list silently — that's how you burn 5,000 credits in one call. Cap to top-N by relevance and confirm.

Per place, extract:
- 3 most-cited pain themes (e.g. "long wait", "billing surprises")
- 1 standout positive (for credible flattery in outreach)
- Owner-reply behavior (responsive owners are more receptive to vendor pitches)

## Phase 5 — assemble the deliverable

Output a single CSV-ready table the user can hand to `crm-export`. Column standard:

```text
place_name, category, address, city, state, zip, phone_e164, website, domain,
rating, review_count, hours_summary, owner_name_guess, owner_email,
tech_signals, top_pain_themes, outreach_hook, source_place_id, source_url
```

Always include `source_place_id` and `source_url` so each row is traceable back to its Maps listing. Skip rows that failed Phase 2 — don't pad the deliverable with junk.

## Cost ceiling

This skill burns budget fast on review mining. Hard caps before any phase begins:

| Operation | Default cap | Hard cap (require AskUserQuestion above) |
|---|---|---|
| Place sourcing | 50 places | 200 places (40 credits) |
| Review mining | 25 reviews × 10 places (12.5 credits) | 100 reviews × 50 places (250 credits — needs explicit OK) |
| Website lookup | top 30 of website-less | top 100 |
| Email finder | top 30 with owner names | top 100 |

State the running cost estimate after each phase. If the total trends above 50 credits, pause and confirm.

## Anti-patterns

- ❌ Calling `google_maps_reviews_scraper` on every place in the list. Always cap and explain.
- ❌ Mixing this skill with `build-prospect-list` in the same query. Source first here, then escalate.
- ❌ Sending personal email outreach to local businesses. Use the business contact (Phase 4a/4b).
- ❌ Skipping the dedupe step — chains will inflate your list with phantom variety.
- ❌ Treating low-rating places as low-quality leads when the *campaign* is "fix your reviews" — they're the target, not noise.

## Follow-ups to suggest

- → `enrich-and-verify` to verify any owner emails before sending.
- → `evidence-score` if the user wants leads ranked (review-trend slope, web-presence gap, tech mismatch).
- → `sequence-builder` (SMS-friendly) for outbound. Local SMB hates long emails — keep it 2-3 lines.
- → `crm-export` for HubSpot/Pipedrive/GHL handoff.

## Offer to schedule this

Local prospecting has high recurring value when the campaign is geographic expansion ("every new city we enter, source the top 50"). At session end, offer:

> "Want me to run this for the next city (or weekly, for new openings) on a schedule? → [scheduled-workflow](../scheduled-workflow/SKILL.md)"

One offer, then drop it if declined.
