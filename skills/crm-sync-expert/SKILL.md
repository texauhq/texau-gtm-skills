---
name: crm-sync-expert
version: 1.0.0
description: |
  Deep CRM architect for HubSpot, Salesforce, GoHighLevel, and Pipedrive. Decides
  between CSV import vs API sync vs webhook-driven push, picks the correct object
  model (Lead vs Contact vs Person vs Sub-account contact), maps lifecycle stages and
  pipeline progression, chooses dedupe keys, handles custom fields the right way
  (suffixes, types, property groups), and avoids the ten mistakes that burn every
  first-time integrator. Pair with crm-export when you need a CSV; use this skill
  when the user wants live sync, API integration, two-way behavior, or "do it right".
  Proactively invoke on "sync to my CRM", "API integration", "custom fields",
  "lifecycle stages", "lead vs contact", "GHL workflow", "duplicate rule", "upsert",
  "two-way sync", "which CRM should I use".
benefits-from: [texau-gtm, crm-export, enrich-and-verify, outreach-expert]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - WebFetch
  - AskUserQuestion
triggers:
  - sync to my CRM
  - push to HubSpot via API
  - Salesforce integration
  - GoHighLevel workflow
  - Pipedrive integration
  - custom field
  - lifecycle stage
  - lead vs contact
  - duplicate rule
  - two-way sync
  - which CRM
---

# crm-sync-expert

An architect for CRM integration. `crm-export` shapes a CSV; this skill designs the *system*.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — what problem are we actually solving

Five CRM scenarios, each with a different right answer:

| Scenario | Right answer |
|---|---|
| One-time import of a prospect list | CSV via [crm-export](../crm-export/SKILL.md). Done. |
| Recurring enrichment of existing CRM records | **Scheduled API sync** — this skill picks the method |
| Trigger a sequence the moment a lead enters a stage | **Webhook from CRM → automation tool** |
| Bidirectional sync (CRM ↔ another system) | **Dedicated iPaaS** (Zapier / Make / n8n / Workato) — not direct API |
| "We haven't picked a CRM yet" | **CRM selection** — §8 |

If the user says "sync" without clarifying, ask which of these five they mean before picking tools.

## Phase 1 — pick the CRM (if the user is choosing)

### Summary matrix

| CRM | Best for | Weakness | Price (relative) |
|---|---|---|---|
| **HubSpot** | Inbound-led B2B, marketing + sales in one, fast time-to-value | Reporting depth vs Salesforce; gets expensive above 10 seats | $$ |
| **Salesforce** | Enterprise B2B, complex territories, regulated industries, multi-cloud | Admin-heavy, slow to stand up, object model is a commitment | $$$$ |
| **Pipedrive** | SMB sales-only use case, pipeline-first UX | Thin marketing + customer-success tooling | $ |
| **GoHighLevel (GHL)** | Agencies, local service businesses, sub-account model, all-in-one with SMS/voice/pipelines | Data model is shallow vs real CRM; reporting is weak | $ (per sub-account) |
| **Close** | High-velocity inside sales, phone-heavy | Limited marketing side; smaller ecosystem | $$ |
| **Attio** | Data-model-first startups, "relational Notion for CRM" | Young product; fewer integrations | $$ |
| **Copper** | Google Workspace-native | Fewer sales features vs HubSpot | $$ |

### Decision heuristic

```
Team size:   < 10    → Pipedrive / Close / Attio / HubSpot Starter
             10–100  → HubSpot (Sales Hub Pro)
             100+    → Salesforce (if complex) or HubSpot Enterprise
Business model:  Agency / local services → GoHighLevel
                 Regulated enterprise    → Salesforce
                 Inbound SaaS            → HubSpot
                 Outbound SaaS SMB       → Close or Pipedrive
                 Phone-heavy             → Close
```

This is advisory. The user owns the decision; present options + tradeoffs, don't pick for them.

## Phase 2 — object model cheat sheet

Each CRM models "people and companies" differently. Getting this wrong at integration time is the single most common cause of "the data looks weird in our CRM."

### HubSpot

- **Contacts** — the person. Dedupe on `email`.
- **Companies** — the organization. Dedupe on `domain`.
- **Deals** — the opportunity. Associated to Contacts + Companies.
- **Tickets** — support case. Different product pillar; rarely in scope for GTM sync.
- **Custom Objects** (Enterprise only) — define your own types beyond the above.

Associations are first-class: a Deal is associated to 1+ Contact + 1 Company. Association labels (Primary Contact, Decision Maker, Champion) are configurable per account.

### Salesforce

- **Lead** — un-qualified prospect. Converts into **Contact + Account + Opportunity** when qualified. Once converted, the Lead record is closed.
- **Contact** — a person attached to an Account. Dedupe is rule-based, not field-based (see §5).
- **Account** — the company.
- **Opportunity** — the deal.
- **Campaign / CampaignMember** — marketing attribution.

The Lead → Contact conversion is a **one-way, irreversible** operation. Data flow design has to respect that.

### Pipedrive

- **Person** — the human. Dedupe on `email` + `phone`.
- **Organization** — the company. Dedupe on `name` + `domain` (configurable).
- **Deal** — pipeline entity. Attached to Person + Organization.
- **Activity / Note / Email** — engagement records.

Pipedrive's model is shallow vs Salesforce — and that's a feature for SMB sales teams.

### GoHighLevel

- **Sub-account (Location)** — each client agency account has isolated data. Per-location API.
- **Contact** — the unit. Dedupe on `email` within a location. No "Company" object — company data lives as custom fields on the contact.
- **Pipeline + Stage** — sales pipelines per sub-account.
- **Opportunity** — contact + pipeline + stage.
- **Workflow** — automation trigger (tag added, stage changed, form submitted).
- **Tag** — the primary segmentation mechanism. Trigger-rich.

GHL is deliberately flat. Don't fight it; use tags aggressively and lean on workflows.

## Phase 3 — integration method — API vs CSV vs iPaaS vs webhook

### When to use each

| Method | When |
|---|---|
| **CSV import** | Any one-time or infrequent load. Never underestimate it — it's the most debuggable option. |
| **Direct API** | Recurring sync, volume < 10k records/day, you have a developer or comfortable scripting caller |
| **iPaaS (Zapier / Make / n8n)** | Multi-source fan-out, "when X happens in CRM, do Y elsewhere", non-engineer operator, visual debuggability |
| **Webhook from CRM** | CRM is the source of truth, you want to *react* to events (stage change → send email, tag add → enrich) |
| **Batch file + SFTP** | Enterprise Salesforce migrations, volumes > 100k records, regulated data |

### Per-CRM API notes (current as of 2026, verify for changes)

**HubSpot** — REST API v3 is current. Rate limits: 150 requests/10s (Pro), 110 requests/10s per token for OAuth apps. Bulk endpoints exist for Contacts + Companies (up to 100 records per call). Free developer API keys deprecated; use Private Apps (per-portal) or OAuth.

**Salesforce** — REST API + Bulk API 2.0. Use Bulk API for anything > 2k records. Per-user daily API call limit (15k + edition-based). OAuth is mandatory; username-password flow is being phased out. Validation rules + duplicate rules fire on every insert — test with small batches first.

**Pipedrive** — REST API v1 + v2 (v2 is the current recommendation). Token-based auth (per-user) or OAuth (for apps). Rate limit: 80 requests/2s burst, 10k/day soft cap. Webhooks mature and reliable.

**GoHighLevel** — API v2 is current. OAuth with per-sub-account tokens; v1 API with key-based auth is deprecated but still works for some endpoints. Rate limits are more aggressive than the others — 100 requests per 10 seconds per location token. Workflows-as-API is powerful; prefer that over raw contact updates where possible.

### Upsert strategy

Every CRM supports an "upsert" pattern; the key differs:

| CRM | Upsert key |
|---|---|
| HubSpot | `email` (Contacts), `domain` (Companies) — native |
| Salesforce | External ID custom field (`External_ID__c`) — must create it first |
| Pipedrive | `email` (Persons) — native, set via `search_field=email` |
| GoHighLevel | `email` or `phone` (Contacts) — native via `upsert` endpoint |

**Rule:** always upsert on a stable external ID you control when possible. Email changes. LinkedIn URLs change less. A UUID you assign changes never.

## Phase 4 — custom fields — do it once, do it right

### Design rules

1. Decide the **property group** first (e.g. "TexAu Enrichment") — keeps custom fields visually contained from the CRM's default UI.
2. **Name fields with a source prefix** — `texau_linkedin_url`, not `linkedin_url`. Future-you will thank present-you when another tool pushes the same field.
3. **Pick the type carefully.** In Salesforce, custom field type cannot be changed after records exist. In HubSpot, type is mutable but it breaks integrations downstream. Always create as the type you want to end with.
4. **Limit picklist values.** CRMs cap at ~150 picklist values, and cleanup after uncontrolled growth is painful. For `seniority` and `function`, use fixed sets (the ones in `_lib/filters-catalog.json`).
5. **Write a field dictionary** — a one-page doc mapping each custom field to its meaning, source, allowed values, and last-updated date. Commit it. Every CRM has an "admin guide" that nobody writes; this is that.

### Common custom fields to add for TexAu-enriched data

| Field | Type | Source |
|---|---|---|
| `texau_linkedin_url` | URL | `enrich_profile.linkedinUrl` |
| `texau_entity_urn` | Single-line text | `enrich_profile.entityUrn` |
| `texau_seniority` | Picklist (10 values) | Resolved from catalog |
| `texau_function` | Picklist (26 values) | Resolved from catalog |
| `texau_company_size_band` | Picklist (9 values) | Resolved from catalog |
| `texau_enriched_at` | Date/Datetime | Client-set on sync |
| `texau_email_status` | Picklist (valid / risky / invalid / unknown / not_found) | From verifier |
| `texau_data_freshness_days` | Number | Derived |

## Phase 5 — dedupe + duplicate rules

Every CRM approaches dedupe differently. Get this wrong and you create 30% duplicate records within a quarter.

### HubSpot

- **Contact dedupe** is automatic on `email` at create time. If no email, you *will* create duplicates.
- No soft-match on name+company out of the box. Use the Duplicate Management feature (in Sales Hub Pro+) or accept that email-less records will double up.
- On CSV import, toggle "Don't create new if only existing property updates" to avoid touching records you don't mean to.

### Salesforce

- **Rule-based** — define Duplicate Rules and Matching Rules. Standard rules for Lead/Contact/Account ship out of the box but are weak; write fuzzy rules on `Email` AND `Name` for real-world quality.
- Rules fire on every insert/update — **turn them off for bulk loads**, run a dedupe pass after, and re-enable.
- Leads-to-Contacts: a Lead and a Contact with the same email can coexist. This is by design — Lead is pre-qualification. Most dedupe failures come from forgetting this.

### Pipedrive

- Settings → Data → Duplicates. Email is the default match for Persons; Organization dedupes on name (case-insensitive).
- Bulk import has a "skip existing" toggle — always use it unless you're intentionally overwriting.

### GoHighLevel

- Contact dedupe on email or phone **within a location**. Cross-location duplicates are a *feature* — agencies want that isolation.
- On workflow-driven creates (form submits, API pushes), GHL will happily make dupes if the incoming `email` field is blank. Always require email at the submission source.

## Phase 6 — lifecycle stage + pipeline progression

This is where CRM integrations turn into revenue or turn into data-quality disasters.

### HubSpot lifecycle stages (default)

```
Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist
```

Stages should only move **forward** automatically. Manual moves backward when needed. Use Lead Status (separate property) for intra-stage detail (New / Attempted / Contacted / Connected / Qualified / Disqualified).

### Salesforce Lead Status + Opportunity Stage

- Lead Status is per-Lead, pre-conversion.
- Opportunity Stage kicks in after Lead → Contact + Opp conversion.
- `IsClosed` and `IsWon` are system booleans keyed to stages — align custom stages with these correctly or forecasting breaks.

### Pipedrive pipeline stages

- Every pipeline is a linear sequence. Multiple pipelines per team is normal (SMB / Mid-market / Enterprise).
- Deal rot: anything that sits in one stage > 30 days is stale; build a view for it.

### GoHighLevel

- Pipelines per sub-account. Stage-change triggers are the richest automation primitive in GHL.
- Tags are orthogonal to stages — use tags for "is this person a decision maker / champion / blocker" and stages for deal progression.

## Phase 7 — avoiding the ten mistakes first-time integrators make

1. Syncing *all* enriched fields into a single huge property group. Future-you can't find anything. Split by purpose.
2. Using `email` as a stable unique ID. People change jobs; their email is the first thing that changes. Prefer LinkedIn URL + a self-assigned UUID.
3. Writing to `FirstName` + `LastName` only — missing headline, company, title means the CRM view looks anemic. Write the summary field too.
4. Not lowercasing email before upsert. `Jane@Acme.com` and `jane@acme.com` create two contacts.
5. Running dedupe rules on bulk imports — slow, and you get rate-limited or hit the daily API cap.
6. Not setting `Lead Source` / `hs_lead_source_info` — attribution breaks forever.
7. Missing the `DoNotEmail` / `Opt Out` checks — you enrich someone who unsubscribed, then re-sequence them. Legal risk + reputational damage.
8. Ignoring Salesforce's duplicate rules thinking they'll catch your mess. They fire on insert; bulk loads bypass them if you misconfigure.
9. Treating GHL like HubSpot. There's no Company object. Stop trying to create one.
10. Not versioning the field dictionary. In 3 months, nobody remembers what `texau_industry_id` means and a PM redefines it to their own use case.

## Phase 8 — CRM selection (if the user hasn't chosen yet)

If the user asks "which CRM should I use" — don't just present the matrix in Phase 1. Ask:

1. Team size today + 12 months out
2. Inbound vs outbound vs mixed
3. Regulated industry? (HIPAA, SOX, FINRA, GDPR-heavy EU)
4. Existing stack (Google vs Microsoft vs mixed)
5. Phone-heavy workflow?
6. Agency model (multiple sub-clients)?
7. Budget per seat per month

Three answers usually narrow to one: `(team size, business model, regulated?)` → (CRM).

## Anti-patterns

- Spinning up custom objects in HubSpot for things that are already a native object with a twist. Stretch existing objects first.
- Syncing in both directions from day one. One-way first, observe for 2 weeks, then add the reverse direction.
- Using display names instead of internal names in CSV imports. Every HubSpot/Salesforce import failure is this.
- Relying on the CRM's own data quality tools exclusively. Run [list-hygiene](../list-hygiene/SKILL.md) *before* the sync, not after.
- Building your own dedupe script when the CRM has native support (HubSpot, Pipedrive, GHL). Only Salesforce routinely needs custom dedupe.
- Hitting APIs from a loop inside an ETL job without exponential backoff. One 429 storm locks you out for the rest of the day.

## What this skill does NOT do

- It does not execute a sync. It designs the sync; the user (or an iPaaS / custom code / [crm-export](../crm-export/SKILL.md)) runs it.
- It does not call the TexAu MCP. No paid credits here.
- It does not write Apex, Zapier Zaps, or n8n workflows. It tells the user *what* each should do.

## Handoff patterns

- "Now I need to actually generate the import file" → [crm-export](../crm-export/SKILL.md)
- "Now I need to enrich the records I'm about to sync" → [enrich-and-verify](../enrich-and-verify/SKILL.md) + [list-hygiene](../list-hygiene/SKILL.md)
- "Now I need to plan the campaign this CRM will drive" → [outreach-expert](../outreach-expert/SKILL.md)

## Appendix — current doc sources (fetch via WebFetch)

When the user asks "is this still true" or "what's changed":

- HubSpot developer docs — `https://developers.hubspot.com/docs/api/overview`
- Salesforce REST API guide — `https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/`
- Salesforce Bulk API 2.0 — `https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/`
- Pipedrive API reference — `https://developers.pipedrive.com/docs/api/v1`
- GoHighLevel API v2 — `https://highlevel.stoplight.io/docs/integrations/`

Don't cite specific endpoint shapes from memory. The APIs evolve. Pull the latest page when precision matters.
