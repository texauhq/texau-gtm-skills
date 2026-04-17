# Architecture

This document explains the three load-bearing pieces of `texau-gtm-skills`: the catalog, the preflight contract, and the routing model. Read it if you're extending the pack or debugging why a skill is doing the wrong thing.

---

## 1. The catalog — `_lib/mcp-catalog.json`

The catalog is a JSON snapshot of the TexAu MCP's tool surface. It is the **only** place in the repo where tool names, categories, credit costs, async/sync flags, bulk variants, and follow-up tools are recorded. Skills never hard-code any of this — they read the catalog.

### Why a snapshot, not a live call

- A live `tools/list` per skill invocation would add 300–1000ms and a network dependency to every turn.
- Most skills need *static* tool metadata (name, cost, category) that changes infrequently. A weekly refresh is enough.
- The snapshot file gets committed — diffs become auditable. You can see when the MCP surface changed and which skills must update.

### Refresh triggers

| Trigger | Path |
|---|---|
| User manually syncs | `./bin/texau-skills-sync` |
| Skill preamble detects `CATALOG_STALE: yes` + `NET: online` + `sync_on_start=true` | Background sync, non-blocking |
| GitHub Actions CI — weekly cron | Commits updated catalog if the MCP surface changed |
| User sets up fresh install | `./setup` runs sync as its last step |

### Resolution order (in `bin/texau-skills-sync`)

```
1.  GET https://mcp.texau.com/catalog.json         (public, no auth — preferred)
2.  POST https://mcp.texau.com/mcp tools/list      (requires TEXAU_API_KEY)
3.  (both failed) leave shipped snapshot in place  (non-fatal — warns user)
```

Layer 1 doesn't exist yet in the MCP server. It's a 10-line endpoint addition to `texau-v3-apis/mcp-server/src/worker.ts` and unlocks zero-config auto-updates. Shipping this unblocks:
- Skills auto-refresh on every session start with no `TEXAU_API_KEY` ceremony.
- Users who read-only the pack (no MCP connection yet) still get fresh data.
- CDN caching means the cost of the call is effectively zero.

### The catalog's shape

See `_lib/mcp-catalog.schema.json`. Key sections:

- `tools[]` — one entry per MCP tool.
  - `name`, `category`, `description` — descriptive.
  - `credits`, `billing` — cost modeling. `billing ∈ { per_call, per_result, per_success, free, waterfall }`.
  - `sync` — boolean. `false` means the tool returns a `jobId` and requires a follow-up.
  - `followup` — the follow-up tool name, present when `sync: false`.
  - `bulk_variant`, `max_batch` — present on single-record tools that have a bulk equivalent.
- `lead_search_filters` — because `lead_search` is the most complex tool, its exclude-capable vs include-only lists are pre-computed so skills don't have to reason about the parameter surface.
- `decision_tree` — the cheap-first tool picker for common discover/find/verify flows.

### Merging live data with curated metadata

When `texau-skills-sync` fetches via `tools/list`, it gets only `name` + `description`. The sync script merges by name:
- Existing entries: keep all curated fields, overwrite `description` with the latest.
- New entries (not in the snapshot): add as `category: "uncategorized"`.

Contributors are expected to annotate `uncategorized` tools in their next PR. The validator (`scripts/validate-skills.mjs`) does not fail on uncategorized entries — it's a soft prompt, not a gate.

---

## 2. The preflight contract — `bin/texau-skills-preflight`

Every skill's first command is the preflight script. It emits `KEY: value` pairs on stdout — one per line, stable order, documented names. Claude reads them to decide whether to sync, warn, or proceed.

### The contract

| Key | Values | Used for |
|---|---|---|
| `CATALOG_OK` | `yes` / `no` | Block if `no` |
| `CATALOG_AGE` | `<seconds>` / `never` | Informational |
| `CATALOG_STALE` | `yes` / `no` | Trigger background sync |
| `CATALOG_TOOLS` | `<int>` | Sanity check (reasonable = 30–60) |
| `FILTERS_OK` | `yes` / `no` | `lead_search` label validation needs this |
| `API_KEY_SET` | `yes` / `no` | Warn before attempting paid calls |
| `SKILLS_VERSION` | `x.y.z` | Display in upgrade prompts |
| `NET` | `online` / `offline` | Decide whether to attempt a background sync |
| `UPGRADE` | `<ver>` / `none` | Offer upgrade at session end |

**Stability guarantee:** these keys are part of the public API of the pack. A key is never renamed; only added. Skills depend on these exact names.

### Why bash, not Node/TS

- **Latency.** Bash starts in ~10ms; Node starts in ~200ms. Multiplied across every skill invocation, it matters.
- **No install step.** Bash is everywhere Claude Code runs. Node is usually there, but not always.
- **Inspectable.** A contributor can read and understand the script in 30 seconds. A compiled TypeScript binary is a black box in diffs.

---

## 3. Routing model — `skills/texau-gtm/SKILL.md`

The entry skill is a router, not a doer. Its single responsibility is to match the user's intent to the right specialist skill.

### Why not let Claude pick skills directly

Claude's intent-matching against the top-level skill list is best-effort. For a pack this size (9 skills, overlapping concerns), ambiguity is common: "find me the CEO of Acme" could be `account-research`, `people_search`, or `pre-meeting-briefing`. The router:

1. Loads the catalog (authoritative cost + tool info).
2. Disambiguates by asking one clarifying question if needed.
3. Invokes the chosen sub-skill with the right framing.
4. Returns unified cost accounting at the end.

This is the same pattern gstack uses — `office-hours` routes to `plan-ceo-review` / `plan-design-review` / etc.

### The routing table

Duplicated in `skills/texau-gtm/SKILL.md` and `README.md`. If you add a sub-skill, update both.

### When the router is bypassed

If the user explicitly invokes a sub-skill by name (e.g. "run build-prospect-list on this ICP"), skip the router — the user already disambiguated. But still run the preflight in the sub-skill.

---

## 4. Data flow

Single-skill invocation:

```
User prompt
  └▶ Claude matches "texau-gtm" (router) by trigger phrase or CLAUDE.md rule
       └▶ run bin/texau-skills-preflight         [~50ms]
            └▶ emits KEY: value pairs
       └▶ if stale+online: background texau-skills-sync    (non-blocking)
       └▶ read _lib/mcp-catalog.json              [in-context]
       └▶ read _lib/filters-catalog.json          [if lead_search path]
       └▶ classify user intent
       └▶ invoke sub-skill (e.g. build-prospect-list) via Skill tool
            └▶ sub-skill runs preflight again (cheap, cached)
            └▶ sub-skill constructs tool calls
            └▶ sub-skill invokes MCP tools (lead_search, etc.)
                 └▶ MCP validates auth + routes to provider
                      └▶ provider returns results
                 └▶ credit debit recorded on user's account
            └▶ sub-skill formats + returns results + cost
       └▶ router offers next-step chains (enrich-and-verify? crm-export?)
```

---

## 5. Failure modes + how we handle them

| Failure | Where it's caught | User experience |
|---|---|---|
| MCP offline | `NET: offline` in preflight | Warn once; proceed with cached catalog |
| Catalog corrupt | `CATALOG_OK: no` | Block; instruct user to run `texau-skills-sync` |
| No API key + tries to call paid tool | `API_KEY_SET: no` + sub-skill inspection | Tell user to connect MCP or set key |
| Tool name unknown at call site | Sub-skill checks catalog before calling | Friendly error ("I don't see `x` in the catalog — is the pack up to date?") |
| Tool cost exceeds budget | Sub-skill's cost gate | `AskUserQuestion` confirmation |
| Sync fails (network, auth, etc.) | `texau-skills-sync` non-fatal exit | Cached snapshot continues to serve |
| New MCP tool without curated metadata | Sync merges with `category: "uncategorized"` | Works; contributor annotates in next PR |

---

## 6. What the pack deliberately does NOT do

- **No state between sessions.** No SQLite, no persistent cache of prospects. If we did, we'd have privacy and multi-user concerns. Every session starts fresh — the MCP provides billing persistence, not us.
- **No direct API calls.** Skills always go through the MCP tool layer. This keeps auth, rate limiting, and billing centralized.
- **No writing to the user's CRM.** The `crm-export` skill shapes data; the user runs their CRM's import. One-way is safer — we can't accidentally corrupt a CRM from here.
- **No telemetry.** gstack has telemetry; we don't. TexAu's existing usage tracking at the MCP layer captures what matters; we don't need another data stream.
