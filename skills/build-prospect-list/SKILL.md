---
name: build-prospect-list
version: 1.0.0
description: |
  Builds a targeted B2B prospect list from a plain-English ICP description. Picks the
  cheapest capable discovery tool (people_search → profile_search → lead_search), validates
  resolvable filter labels, constructs the query narrow-first, paginates with sessionId,
  and returns a deduplicated, cost-accounted result set. Use whenever the user asks to
  find people, build a list, source prospects, target accounts, or search LinkedIn by
  filters. Proactively invoke on phrases like "find 20 CTOs", "VP Sales at SaaS",
  "list of founders in NYC", "target account list".
benefits-from: [texau-gtm, cost-optimizer, crm-export]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - build a prospect list
  - find <N> <title> at <company/industry/location>
  - target account list
  - source prospects
  - list of <title>
  - ICP search
---

# build-prospect-list

Translate a plain-English ICP into an executable, cost-optimal prospect search.

## Preamble — run first

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

If `CATALOG_OK: no` → stop and run `texau-skills-sync`. Do not guess tool names.

## Phase 0 — parse the ICP

Extract these fields from the user's prompt (ask for missing ones only if critical). Set to `null` if not specified — do **not** invent.

| Slot | Example value | Maps to |
|---|---|---|
| `role_titles` | `["VP Sales", "Head of Sales"]` | `currentJobTitles` |
| `seniority` | `["Director", "Vice President"]` | `seniority` (resolved) |
| `functions` | `["Sales"]` | `functions` (resolved) |
| `target_company_names` | `["Stripe", "Plaid"]` | `currentCompanies` |
| `industries` | `["Software Development", "Financial Services"]` | `industries` (resolved) |
| `company_size` | `["201-500", "501-1000"]` | `companySize` (resolved) |
| `locations` | `["San Francisco Bay Area", "New York"]` | `geoIds` (geo-resolved) |
| `experience_band` | `["6 to 10 years"]` | `yearsOfExperience` (resolved) |
| `languages` | `["English"]` | `profileLanguages` (resolved) |
| `changed_jobs_recently` | `true` / `null` | `recentlyChangedJobs` |
| `exclusions` | `{ currentCompanies: ["Acme"], industries: ["Education"] }` | `exclude` object |
| `count_target` | `50` | used for pagination planning |

If the user pasted a **Sales Navigator URL**, skip to Phase 3 with `salesNavUrl`.

## Phase 1 — pick the right tool

Read `_lib/mcp-catalog.json → decision_tree.discover_people`. Rules of thumb:

1. **`people_search` (0.1/result)** — use when the user wants *broad discovery* on industry/title/location and exact precision isn't critical. Queries an indexed cache, returns hundreds fast.
2. **`profile_search` (0.1/result)** — use when the user gives a *specific name, exact title string, or a specific company ID/URL* and wants live LinkedIn. Does not support seniority/industry ID filters.
3. **`lead_search` (0.5/result)** — use when the ICP has any of:
   - Seniority bands (`Director`, `VP`, `CXO`)
   - Function + industry combinations
   - Company headcount bands
   - Years-of-experience bands
   - Multi-company OR multi-title queries with exclusions
   - Geo-based precision needing `geoIds`
   - A Sales Navigator URL

Say out loud which tool you're choosing and why (1 sentence). This helps the user catch mis-routes early and cost surprises.

**Safety check:** if the ICP can be satisfied by `people_search` *alone*, offer it first. `lead_search` is 5× more expensive per result. Only escalate when the filters genuinely require it.

## Phase 2 — validate resolvable labels

If the chosen tool is `lead_search`, every label the user gave for `seniority`, `functions`, `companySize`, `yearsOfExperience`, `yearsAtCurrentCompany`, `profileLanguages` must match the catalog exactly (case-insensitive). `industries` has 434 options — validate by calling the `search_reference_data` MCP tool (free).

Read [`_lib/filters-catalog.json`](../../_lib/filters-catalog.json) to validate. If any label is unrecognized:

1. Suggest the closest 3 valid labels.
2. Ask the user to pick one via `AskUserQuestion` — do not silently substitute.

For `geoIds`: pass location *names* directly (max 10). The server resolves via LinkedIn's geo-id-search API. If the user has >10 locations, call `geo_id_search` (or the `/api/v1/geo_id_search` endpoint via `WebFetch` if the MCP doesn't expose it) to pre-resolve to numeric IDs, then pass those — no upper bound on numeric IDs.

## Phase 3 — construct the query, narrow-first

Principle: **always start narrow**. It's cheaper to widen than to paginate through 10k junk results. Add filters in this order of selectivity (rough guide):

1. `currentCompanies` / `currentJobTitles` (most selective)
2. `seniority` + `functions` (combined)
3. `companySize` + `industries`
4. `geoIds` + `locations`
5. `profileLanguages`, `yearsOfExperience` (least selective — save as tiebreakers)

Example translations:

| Plain English | JSON body |
|---|---|
| "Directors+ at SaaS companies 200-1000 in the Bay Area, exclude anyone at Acme Corp" | `{ "seniority": ["Director","Vice President","CXO"], "industries": ["Software Development"], "companySize": ["201-500","501-1000"], "geoIds": ["San Francisco Bay Area"], "exclude": { "currentCompanies": ["Acme Corp"] } }` |
| "Engineering leaders who recently changed jobs, English-speaking" | `{ "seniority": ["Director","Vice President"], "functions": ["Engineering"], "recentlyChangedJobs": true, "profileLanguages": ["English"] }` |

### What you CANNOT exclude

Claude must know this — it's a common failure. The following filters have **no exclusion counterpart** and will be silently ignored if placed inside `exclude`:

- `search`, `firstNames`, `lastNames`
- `yearsOfExperience`, `yearsAtCurrentCompany`
- `companySize`
- `profileLanguages`
- `recentlyChangedJobs`

If the user wants "exclude small companies" or "exclude <2 years experience", do it client-side on the returned list. Tell them that upfront.

(The authoritative exclusion list is in `_lib/mcp-catalog.json → lead_search_filters.exclude_capable` with per-field max caps.)

## Phase 4 — paginate correctly

- `page: 1` on the first call. **Omit** `sessionId` — the server generates one.
- Read `sessionId` from the response. **Echo it back unchanged** on every subsequent page alongside `page: 2`, `page: 3`, etc.
- Max `totalPages` is 100. If the ICP yields >100 pages (~2,500 results), narrow further — don't brute-force.

### Cost math before you fire

Tell the user the expected cost *before* the first page:

```
tool = lead_search
page_size ≈ 25
cost_per_page = 0.5 × 25 = 12.5 credits
target = {count_target} results
expected_pages = ceil(count_target / 25)
expected_total = expected_pages × 12.5 credits
```

If `expected_total > 50 credits`, confirm before proceeding (use `AskUserQuestion`).

## Phase 5 — execute + dedupe

Call the chosen MCP tool with the constructed body. After each page:

1. **Dedupe** on `elements[].id` — across pages, just in case.
2. **Progress-report** every 2 pages: "Page 3 of 8, 75 leads so far, ~37.5 credits spent."
3. **Stop early** when `pagination.pageNumber == pagination.totalPages` or when `count_target` is reached.
4. **Retry once** on transient `502` — then surface the error.

## Phase 6 — return the result

Present results as a compact table (max 10 rows in chat), then offer:

- "Want me to enrich these with emails? → [enrich-and-verify](../enrich-and-verify/SKILL.md)"
- "Want me to export to CSV/HubSpot/Salesforce? → [crm-export](../crm-export/SKILL.md)"
- "Want to widen/narrow and re-run? Say the word."

Always include:
- **Total credits used** (sum of page costs)
- **Total unique leads** (post-dedupe)
- **Remaining session ID** — so the user can paginate later without re-running the search
- **Raw filters JSON** — so the user can tweak and re-submit

### Offer to schedule this

If the user got a useful result, always ask:

> "Want me to run this ICP every Monday morning and email you the new leads? → [scheduled-workflow](../scheduled-workflow/SKILL.md) with a 500-credit/month ceiling."

Weekly refresh is the highest-leverage recurring pattern — titles and job changes happen continuously, and fresh leads beat stale ones every time.

## Failure modes you must handle

| Symptom | Root cause | Remediation |
|---|---|---|
| `400 Unknown seniority/industry/function value` | Label not in catalog | Re-validate against `filters-catalog.json`; ask user to pick valid label. |
| `400 geoIds name not found` | Location too vague or misspelled | Try more specific (`"Berlin, Germany"` not `"Berlin"`), or pre-resolve via `geo_id_search`. |
| `400 sessionId prefix mismatch` | Session from a different API key | Drop the sessionId; restart from page 1 with a fresh one. |
| Empty `elements[]` on page 1 | Filters too narrow | Remove least-selective filter(s); re-run. Tell the user what you removed. |
| `totalPages == 100` but user wants more | LinkedIn cap | Split the search by a selector (geo region, industry sub-segment) and merge dedup'd results. |
| `502` twice in a row | Upstream outage | Wait 30s, retry once. If still failing, surface the error — do **not** burn credits in a retry loop. |

## Example session

> **User:** "Find 40 Heads of Engineering at SaaS companies 201-1000 in NYC or SF. English speakers. Exclude anyone at Stripe or Plaid."

> **You:**
> 1. Parse ICP → map to lead_search fields.
> 2. Tool pick: `lead_search` (seniority + company-size + geo → other tools can't express this).
> 3. Validate labels — all in catalog.
> 4. Cost estimate: 40 / 25 ≈ 2 pages × 12.5 = 25 credits. Proceeds without extra confirm (below $0.50 threshold).
> 5. Fire page 1, dedupe, continue to page 2, stop at 40 unique.
> 6. Return table + "want emails? that's enrich-and-verify, ~80 more credits."
