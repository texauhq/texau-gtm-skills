---
name: scheduled-workflow
version: 1.0.0
description: |
  Turns any GTM skill in this pack into a recurring Claude schedule — weekly prospect
  refreshes, nightly CRM enrichment, daily pre-meeting briefings, monthly account
  reviews, quarterly competitive scans. Invokes Claude's native scheduling feature
  (the /schedule skill) under the hood, picks sensible cadences per workflow type,
  enforces monthly credit ceilings so a runaway cron doesn't drain the balance, and
  writes a plain-English schedule summary the user can edit later. Proactively offer
  when a user finishes any workflow that would obviously benefit from running again
  on a cadence.
benefits-from: [texau-gtm, build-prospect-list, enrich-and-verify, account-research, pre-meeting-briefing, list-hygiene, competitive-intel, evidence-score]
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Skill
  - AskUserQuestion
triggers:
  - schedule this
  - run this every
  - automate this
  - set up a cron
  - nightly prospect refresh
  - weekly competitor scan
  - daily briefing
  - recurring enrichment
  - do this automatically
---

# scheduled-workflow

The "set it and forget it" specialist. Wraps Claude's scheduling feature around any GTM workflow in this pack so the user's go-to-market runs while they sleep.

## Preamble

```bash
~/.claude/skills/texau-gtm-skills/bin/texau-skills-preflight
```

## Phase 0 — is scheduling the right answer?

Not every workflow should repeat. Ask yourself (or the user):

| Signal | Schedule it |
|---|---|
| The data goes stale on a clock (titles change, companies hire) | ✅ yes |
| The user asks "just do this again next week / every Monday" | ✅ yes |
| The workflow produces a report a human will read | ✅ yes, scheduled delivery |
| The workflow touches 1000+ records | ⚠️ schedule but split across nights |
| The user needs the result right now, once | ❌ run it once, don't schedule |
| Every run spends > 500 credits | ⚠️ confirm the monthly ceiling first |

If any column-1 signal fires, offer scheduling.

## Phase 1 — pick the cadence

Default cadences per workflow. The user can override.

| Workflow | Default cadence | Why |
|---|---|---|
| `build-prospect-list` (top-of-funnel refresh) | Weekly, Mon 05:00 local | New leaders change jobs constantly; weekly catches the turnover |
| `enrich-and-verify` (new CRM contacts since last run) | Nightly, 02:00 local | Keep CRM fresh without blocking daytime usage |
| `account-research` (tier-1 named accounts) | Monthly, 1st of month | Firmographics + decision makers don't shift weekly |
| `account-research` (target-account deep dive) | Quarterly | Heavy spend; quarterly captures meaningful change |
| `pre-meeting-briefing` (calendar-driven) | Daily, 06:00 local | Brief runs before the user's morning; one-shot per meeting |
| `list-hygiene` (pre-campaign checkpoint) | Weekly, Fri 16:00 local | Clean Friday → campaign Monday |
| `competitive-intel` (ad + post sweep) | Weekly, Mon 07:00 local | Competitor ad creatives churn weekly; anything less misses rotation |
| `evidence-score` (scoring backlog) | Nightly | Scores compound with new signal; run after enrichment |
| `check_usage` (budget watchdog) | Daily, 09:00 local | Catch runaway spend within one day, not one month |

## Phase 2 — set the cost ceiling

Every schedule must have a **monthly credit ceiling** so a regression or filter change doesn't drain the account. Ask:

> "What's the most credits you want this schedule to spend per month? (default: 2× one-run cost × expected runs/month)"

The user's `AskUserQuestion` answer becomes the hard stop. If a scheduled run's pre-estimate exceeds the remaining monthly budget, the run skips and writes a note instead of spending.

## Phase 3 — compose the schedule

Invoke Claude's native scheduling feature (the `/schedule` skill) with a complete brief:

```
Scheduled workflow — <workflow-name>
Cadence:          <cron expression or human description>
Cost ceiling:     <N credits / month>
On-run prompt:
    Load the texau-gtm skill. Run <sub-skill> with these filters: <JSON>.
    If running cost would exceed <ceiling remaining>, skip and log.
    On completion, <delivery method below>.
Delivery:         email | Slack webhook | Claude conversation | write to file
```

Hand off to the `/schedule` skill to create the trigger. That skill knows the platform-specific cron semantics.

### Cadence format cheat sheet

- `"every Monday at 05:00 local"` — most readable; prefer this
- `"0 5 * * 1"` — standard 5-field cron
- `"every 14 days"` — for bi-weekly runs that don't land on a fixed weekday

Avoid sub-hour cadences. Nothing in this pack benefits from every-15-min polling — stale data isn't fresh data.

## Phase 4 — choose a delivery method

Where does the result go when the user isn't there to see it?

| Delivery | When to use |
|---|---|
| **Email to user** | Default. Works everywhere. Best for reports. |
| **Slack webhook** | Team visibility. User pastes a webhook URL; we include it in the prompt. |
| **CRM push via crm-sync-expert patterns** | Enrichment schedules that update HubSpot/Salesforce/Pipedrive/GHL records directly. |
| **Write to file** | For developers running this on their own machine with Claude Code + cron. |
| **Claude conversation** | When the user will return to Claude to read results; scheduled triggers land in the next conversation. |

If the user doesn't specify, default to email and tell them it's changeable later.

## Phase 5 — compose the run-time prompt

The scheduled trigger fires a prompt at Claude. Write it cleanly enough that the next session can execute it with no extra context. Template:

```
Run the weekly prospect refresh.
Skill:         build-prospect-list
ICP:           <frozen filter JSON>
Page limit:    3 pages (75 results max)
Cost ceiling:  <N> credits — check check_usage first; abort if balance < ceiling.
Dedupe:        suppress any LinkedIn URL already in our CRM.
Delivery:      Email the new leads (not already-seen) to <user@example.com> as CSV.
If anything fails, leave a note in the conversation — don't retry.
```

Keys: it's self-contained, it names the skill, it carries the filters, it has a budget, it names the delivery method, and it has a fail-safe clause.

## Phase 6 — write a plain-English schedule summary

After creating the trigger, produce a human-readable record the user can return to:

```
Scheduled: Weekly Prospect Refresh
  What:       build-prospect-list with fixed ICP
  Cadence:    Mon 05:00 America/Los_Angeles
  Budget:     500 credits / month (alert at 80%)
  Delivery:   Email to you@yourdomain.com as CSV
  Created:    2026-04-17
  Edit / cancel: ask Claude to "update my weekly prospect refresh"
```

Offer to save this as a markdown file so they have a local copy.

## Phase 7 — tell the user what the runtime contract is

Claude scheduling needs to be on. If the user's environment doesn't have it:

- **Claude Code** → works natively via the `/schedule` skill
- **Claude Desktop** → triggers land in the next conversation; user must open Claude for the schedule to "catch up"
- **Cursor / Windsurf / other MCP hosts** → schedules are a Claude Code / Desktop feature; offer to set up a plain cron + `claude -p` one-liner instead

## Common scheduling recipes

### Weekly ICP refresh → email to user

```
Cadence:      Mon 05:00
Workflow:     build-prospect-list
Fixed inputs: { seniority: ["Director","VP","CXO"], industries: ["SaaS"], geoIds: ["SF Bay Area"] }
Dedupe:       against last run's output + user's CRM export
Budget:       500 credits / mo
Delivery:     email CSV
```

### Daily pre-meeting briefings from calendar

```
Cadence:      Daily 06:00
Workflow:     pre-meeting-briefing for every meeting that day
Inputs:       pull LinkedIn URL from calendar event description or invitee email
Budget:       100 credits / week
Delivery:     email one-per-meeting, or Slack to #morning-briefing
```

### Monthly tier-1 account refresh

```
Cadence:      1st of month, 08:00
Workflow:     account-research (light scan mode) on named-account list
Inputs:       static list of 50 target accounts
Budget:       1500 credits / mo
Delivery:     HubSpot company-record update via crm-sync-expert patterns
```

### Daily usage watchdog

```
Cadence:      Daily 09:00
Workflow:     check_usage (free); alert if daily spend > 500 credits
Inputs:       none
Budget:       0 credits (the tool is free)
Delivery:     Slack to #ops only if threshold breached
```

### Quarterly full competitive scan

```
Cadence:      1st of Jan/Apr/Jul/Oct, 07:00
Workflow:     competitive-intel (deep-dive mode) across 5 named competitors
Budget:       2000 credits / quarter
Delivery:     write report to /gtm/competitive/YYYY-QN.md + email summary
```

## Anti-patterns

- Scheduling a workflow that only makes sense once (a single-account research job for a deal that closes next week).
- Running enrichment on the same list nightly — waste. Enrich on new-only, or weekly-delta.
- Cadence shorter than the data-refresh clock (nothing about posts or titles moves hourly).
- No cost ceiling. Every schedule must have one or it's a time bomb.
- Email delivery for workflows that produce 1000+ rows. Write to a file or CRM instead.
- Scheduling during a product launch or on-call week without a pause mechanism.

## Handoff patterns

After scheduling, always remind:

- "You can list all schedules by asking me to `/schedule list`."
- "Edit by saying `update my weekly prospect refresh: change the industry to Fintech`."
- "Pause by saying `pause all texau schedules for 2 weeks`."
- "Cancel by saying `delete the weekly prospect refresh schedule`."

## Cost

This skill does not spend TexAu credits. It only sets up future spends — which *are* gated by the ceiling the user agreed to.
