---
name: crm-export
version: 1.0.0
description: |
  Shapes results from any other TexAu GTM skill into a target-CRM-ready format —
  HubSpot, Salesforce, Pipedrive, Close, Attio, or plain CSV / NDJSON. Picks correct
  field names per CRM, maps LinkedIn and enrichment fields to canonical CRM properties,
  handles custom fields, and offers safe dedupe-on-import hints. Use when the user says
  "push this to <CRM>", "export as CSV", or "format for <CRM>".
benefits-from: [texau-gtm, build-prospect-list, enrich-and-verify, list-hygiene]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - export to CRM
  - export to CSV
  - push to HubSpot
  - push to Salesforce
  - push to Pipedrive
  - format for <CRM>
  - CRM-ready
---

# crm-export

Take a TexAu result set and hand the user exactly what their CRM's importer wants. This skill is for **one-time or low-frequency file imports** — CSV, NDJSON, copy-paste. If the user needs a recurring API sync, custom field architecture, lifecycle-stage mapping, or is choosing a CRM, route to [crm-sync-expert](../crm-sync-expert/SKILL.md) instead.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — confirm target

Ask if unclear:
- **Target CRM**: HubSpot / Salesforce / Pipedrive / Close / Attio / Generic CSV / NDJSON
- **Object type**: Contacts / Leads / Companies / Accounts
- **Upsert key**: `email` (most common), `linkedin_url`, or `external_id`
- **Output mode**: File path (write locally) or pasted into chat

## Phase 1 — normalize the input

Accept any upstream shape:
- `lead_search.elements[]`
- `enrich_profile` single-object or list
- `enrich-and-verify` hydrated records
- `list-hygiene` cleaned output

Internally map to a **canonical record**:

```json
{
  "first_name": "",
  "last_name": "",
  "full_name": "",
  "headline": "",
  "email": "",
  "email_status": "",
  "phone": "",
  "linkedin_url": "",
  "company_name": "",
  "company_domain": "",
  "company_linkedin_url": "",
  "title": "",
  "seniority": "",
  "function": "",
  "industry": "",
  "company_size": "",
  "city": "",
  "country": "",
  "source": "texau",
  "source_skill": "<skill that produced it>",
  "enriched_at": "<ISO8601>"
}
```

Then project from canonical into the target CRM's field names.

## Phase 2 — CRM-specific field maps

### HubSpot (Contacts, v3 API / CSV import)

| Canonical | HubSpot property |
|---|---|
| first_name | `firstname` |
| last_name | `lastname` |
| email | `email` |
| phone | `phone` |
| title | `jobtitle` |
| linkedin_url | `linkedinbio` (or a custom property like `linkedin_url` if defined) |
| company_name | `company` |
| company_domain | `website` (on company record) |
| seniority | custom: `hs_seniority` |
| industry | `industry` |
| source | `hs_lead_source_info` (default: `texau`) |

Notes:
- HubSpot dedupes Contacts on **email**. No email → will create a dupe. Surface this.
- For Companies, HubSpot dedupes on **domain**.
- CSV header row uses internal names, not labels.

### Salesforce (Lead / Contact, CSV or Data Loader)

| Canonical | Salesforce field |
|---|---|
| first_name | `FirstName` |
| last_name | `LastName` (required) |
| email | `Email` |
| phone | `Phone` |
| title | `Title` |
| linkedin_url | custom: `LinkedInURL__c` |
| company_name | `Company` (Lead, required) or `Account.Name` (Contact) |
| industry | `Industry` |
| seniority | custom: `Seniority__c` |
| source | `LeadSource` (`Web`, `Other`, etc.) |

Notes:
- Salesforce **requires** `LastName` and (for Leads) `Company`.
- Dedupe strategy: prefer **Data Loader with upsert on an External ID** field.

### Pipedrive (Persons, CSV import)

| Canonical | Pipedrive field |
|---|---|
| first_name + last_name | `Name` (single field) |
| email | `Email` |
| phone | `Phone` |
| title | `Title` |
| linkedin_url | custom: `LinkedIn URL` |
| company_name | `Organization` |
| company_domain | `Domain` (on Organization) |

### Close (Leads / Contacts)

Close uses a **Lead → Contact** hierarchy. If you have N contacts at the same company, group them under one Lead by company_name.

| Canonical | Close field |
|---|---|
| company_name | `display_name` (Lead) |
| first_name + last_name | `name` (Contact) |
| email | `emails[0].email` |
| phone | `phones[0].phone` |
| title | `title` |
| linkedin_url | `urls[0]` with `type: "url"` |

### Attio

| Canonical | Attio attribute |
|---|---|
| first_name | `first_name` |
| last_name | `last_name` |
| email | `email_addresses` |
| linkedin_url | `linkedin` |
| company_name | `company` (linked record) |

### Generic CSV

Always emit a UTF-8, RFC-4180 compliant CSV:
- Header row with **snake_case** field names
- Values quoted only when they contain `,`, `"`, or newline
- `""` for embedded quotes
- One blank trailing newline

### NDJSON (for programmatic upstream)

One canonical record per line. Include all fields — downstream code can ignore what it doesn't need.

## Phase 3 — emit

Default: write to `./texau-export-<YYYYMMDD-HHMM>-<crm>.csv` in the current directory. Offer alternate path if the user prefers.

Preview the first 3 rows inline in chat for confirmation before writing.

## Phase 4 — import hints

After emit, give a **tested** instruction block for each CRM:

### HubSpot CSV import
> Go to **Contacts → Import → File from computer → Contacts**. When mapping, confirm `email` is the dedupe key. Toggle "Don't create new if only existing property updates" if you're enriching existing contacts.

### Salesforce Data Loader
> Use `Insert` for net-new, `Upsert` for sync. For Upsert, map `External_ID__c` and check "Use bulk API with serial mode" if you have >10k rows.

### Pipedrive
> Go to **Settings → Import data → From a spreadsheet**. Map `Organization` + `Name` to Pipedrive's people template. Enable "Skip existing persons".

### Close / Attio
> Both support CSV via their UI importers. Map by email for dedupe.

## Anti-patterns

- **Don't** emit Salesforce CSV without `LastName` — import will fail for every row missing it.
- **Don't** use HubSpot's display labels in the header row — use internal names.
- **Don't** emit Pipedrive CSV with `first_name` + `last_name` split — collapse to `Name`.
- **Don't** silently truncate fields — if a `summary` is 2,500 chars and the CRM caps at 1,000, warn and let the user decide.

## Cost

This skill calls **zero** TexAu tools. It's pure format transformation. Free.

## Follow-ups

If the user wants to keep enriching after export:
- "Build another prospect list? → [build-prospect-list](../build-prospect-list/SKILL.md)"
- "Add emails to records that don't have them yet? → [enrich-and-verify](../enrich-and-verify/SKILL.md)"
