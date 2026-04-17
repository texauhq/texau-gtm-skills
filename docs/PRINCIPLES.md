# Principles

These are the non-negotiables for every skill in this pack. If a skill violates one of these, it's a bug — fix the skill, don't relax the principle.

## 1. The MCP is the source of truth

Tool names, credit costs, parameter limits, and async/sync behavior live in the TexAu MCP. The catalog mirrors it. Skills read the catalog. They never duplicate this state.

**Consequence:** if a number appears in a skill without a reference to `_lib/mcp-catalog.json`, that number is a bug in the making. Someone will change the MCP, and the skill will silently go stale.

## 2. Cheap first

For any goal with multiple viable paths, the skill starts with the cheapest capable path and escalates only when necessary.

- `people_search` (0.1/result) before `lead_search` (0.5/result) — every time the filters fit.
- Bulk variants before singleton loops.
- Classify before verify.

**Consequence:** a cost-optimizer check is not optional. Users who want the precise path can ask for it; users who don't know should get the cheap path automatically.

## 3. Narrow first

Every discovery query starts with the most selective filter. It is cheaper to widen than to paginate through junk.

**Order of selectivity** (rough, for `lead_search`):
1. `currentCompanies` / `currentJobTitles` (very narrow)
2. `seniority` + `functions` combined
3. `companySize` + `industries`
4. `geoIds` + `locations`
5. `profileLanguages`, `yearsOfExperience` (least narrow)

## 4. Never burn silent credits

Any paid call is **named and costed before it runs**. Paths expected to cost >20 credits gate on `AskUserQuestion`.

**Why 20:** big enough to be meaningful, small enough not to be annoying. Tune per skill if the workload is predictable.

**Consequence:** progress bars that silently chew through 500 credits are a design failure. Always surface "page 3 of 8, 75 leads so far, 37.5 credits spent."

## 5. Evidence or it didn't happen

Every claim about a company or person must tie back to the tool call that produced it. No speculating. No filling in gaps with training-data assumptions.

- ✅ "Acme posted on 2026-03-12 about a migration to Postgres — that's a likely signal they're evaluating DB infrastructure."
- ❌ "Acme is probably a Postgres shop."

## 6. Bulk before loop

`enrich_profiles_bulk` for lists ≥ 2. `find_emails` batch for lists ≥ 5. `verify_emails` batch for lists ≥ 10.

Looping `enrich_profile` 50 times is a design failure. It's slower, more expensive in wall-clock, and more fragile than one bulk call.

## 7. Classify before verify

When cleaning a list:
1. Classify first (`identify_email_type` — 0.5 credits) — drops disposables/roles for cheap.
2. Verify second (`verify_emails` — 0.5 credits) — only on what survived step 1.

Reversing this order pays 0.5 credits to verify junk that was going to be dropped anyway.

## 8. Hard failures cost nothing

TexAu's waterfall endpoints **do not charge on hard-fail** (all providers unreachable). This is a rare gift — skills should retry once after a short delay before surfacing the error. Never bake in aggressive retry loops that could burn credits elsewhere.

## 9. The router, not the sub-skill, reads the big catalog

Only the entry `texau-gtm` skill reads the full `_lib/mcp-catalog.json` into context. Sub-skills read only the slices they need (typically `tools[]` filtered by category). This keeps sub-skill context windows lean.

## 10. No hidden state, no hidden writes

The pack stores exactly three things on disk, all under `$TEXAU_SKILLS_HOME` (default `~/.texau-skills/`):
- `config` — user preferences (proactive, sync_on_start, default_mode)
- `.last-sync` — timestamp of the most recent catalog refresh
- `.upgrade-cache` — throttle for the GitHub version check

Nothing else persists. No prospect data, no enriched profiles, no email lists.

## 11. Skills are playbooks, not documentation

Instructions must be **imperative to an agent**, not descriptive to a human. Prefer:

> "Read `_lib/mcp-catalog.json → decision_tree.discover_people`. Pick the cheapest tool whose filters match the ICP."

over:

> "The catalog has a decision tree that can help you pick a tool."

## 12. One clarifying question, not five

When the user's request is ambiguous, ask exactly one question via `AskUserQuestion`. If you need more info, ask the first, then the second after they answer. Never open with a wall of questions.

## 13. Every skill has an obvious next step

At the end of a skill's output, offer one or two follow-up chains. Example from `build-prospect-list`:

> Want me to find emails for these? → `enrich-and-verify`
> Want to export to HubSpot? → `crm-export`

This is what makes the pack a *system* rather than a grab-bag.

## 14. The user can always say "stop"

If a user interrupts mid-task, stop immediately. Never silently continue a batch. Never assume it's fine to burn through the remaining credits because the plan is half-done.

---

## The meta-principle: complete work, priced up front

Do the whole job — not a half-done approximation — every time. Skipping steps to look fast produces brittle output that the user has to redo themselves, which is the worst outcome.

But TexAu credits aren't free, and the user's budget is finite. So the second half of completeness is transparency: say what the full path will cost *before* you start, and let the user choose whether they want everything or just a slice.

Silent thoroughness is a trap. Loud thoroughness, with a price tag attached, is the job.
