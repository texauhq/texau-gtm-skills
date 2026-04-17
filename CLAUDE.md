# TexAu GTM Skills — development

> This file is for **contributors** to `texau-gtm-skills`. If you're a user, read [README.md](./README.md) instead.

## What this pack is

An opinionated Claude Skills layer on top of the TexAu MCP. The MCP gives Claude the *hands* (tools + schemas); this pack gives Claude the *brain* (when to use which tool, in what order, under what cost budget).

## Ground rules

1. **MCP is the source of truth for tools.** Never hard-code tool names, credit costs, or parameter limits in a skill. Always read them from `_lib/mcp-catalog.json`.
2. **Every skill starts with the preflight preamble.** Skips equal fragility. Copy the pattern from `skills/texau-gtm/SKILL.md`.
3. **Never burn silent credits.** Any path expected to cost >20 credits must gate on `AskUserQuestion` unless the user has explicitly pre-authorized.
4. **Narrow first, widen if needed.** Every discovery skill must start with the most selective filters and widen by instruction, not by default.
5. **Prefer cheap tools.** `people_search` before `lead_search`. Bulk before loop. Classify before verify. Run `scripts/validate-skills.mjs` to catch anti-patterns.

## Commands

```bash
./setup                          # one-time install + perms + first sync
./bin/texau-skills-sync          # refresh _lib/mcp-catalog.json from live MCP
./bin/texau-skills-sync --check  # exit 1 if catalog >7 days old
./bin/texau-skills-preflight     # emit KEY: value health report (used by skills)
./bin/texau-skills-config get|set|unset|list <key> [value]

node scripts/validate-skills.mjs  # lint every SKILL.md (frontmatter, links, referenced tools)
```

## Adding a new skill

1. Create `skills/<name>/SKILL.md`.
2. Frontmatter (required):
   ```yaml
   ---
   name: <name>
   version: 1.0.0
   description: |
     <one paragraph — what this skill does and the exact trigger conditions>
   benefits-from: [<related-skills>]
   allowed-tools:
     - Bash
     - Read
     - Write
     - Edit
     - AskUserQuestion
   triggers:
     - <plain-English user phrase 1>
     - <phrase 2>
   ---
   ```
3. First section must be the preflight preamble (copy from any existing skill).
4. Reference tools **only** by their names in `_lib/mcp-catalog.json`. If you need a new tool, add it to the MCP first; this pack follows.
5. Update the router: add a row to the routing table in `skills/texau-gtm/SKILL.md`.
6. Run `node scripts/validate-skills.mjs`. Everything must pass.
7. Update the top-level `README.md` skill catalog.

## Updating when the MCP changes

1. Someone ships a new MCP tool (e.g. `enrich_phone_bulk`).
2. Run `./bin/texau-skills-sync` locally — it rebuilds `_lib/mcp-catalog.json`.
3. New tools without curated metadata land with `category: "uncategorized"`. Edit `_lib/mcp-catalog.json` to add `category`, `credits`, `billing`, `followup`, `bulk_variant`, `max_batch` as appropriate.
4. If the new tool deserves its own skill or changes a playbook, update the relevant `SKILL.md`. Version-bump the affected skill (semver) and the top-level `VERSION`.
5. Commit. CI (`.github/workflows/validate.yml`) re-runs sync + validation.

## Versioning

- Top-level `VERSION` — pack version. Bump on any user-visible change.
- Per-skill `version:` in frontmatter — bumps when *that skill's behavior* changes.
- The `bin/texau-skills-preflight` script checks GitHub for a newer top-level `VERSION` and surfaces `UPGRADE: <ver>` through the preamble. Users see an unobtrusive offer at session end.

## Principles

- **GTM methodology belongs here, not in MCP tool descriptions.** Cost heuristics, ICP→filter mapping, pagination strategy, CRM field maps, "don't loop singletons" — all live in skills.
- **Every skill is a playbook, not documentation.** Instructions should be imperative to an agent, not descriptive to a human.
- **Quote sources.** Evidence-based outputs (posts, ads, tech stack) must link back to the tool call that produced them.
- **No hidden spending.** Every paid call is named and costed before it runs.
- **Cheap first.** Always offer the 10× cheaper path before the precise one.

## File layout

```text
texau-gtm-skills/
├── VERSION                         # single-line semver, used by sync + upgrade check
├── package.json                    # npm publish metadata
├── setup                           # one-command install
├── README.md                       # user-facing
├── CLAUDE.md                       # this file — contributor-facing
├── bin/
│   ├── texau-skills-sync           # refresh catalog from live MCP
│   ├── texau-skills-preflight      # health check → KEY: value pairs
│   └── texau-skills-config         # user prefs (proactive, sync_on_start, etc.)
├── _lib/
│   ├── mcp-catalog.json            # source of truth for tools + costs
│   ├── mcp-catalog.schema.json     # JSON schema for the above
│   ├── filters-catalog.json        # search_reference_data snapshot
│   └── CLAUDE-block.md             # written by setup; paste target
├── skills/
│   ├── texau-gtm/SKILL.md          # entry router
│   └── <thirteen more playbooks>
├── scripts/
│   └── validate-skills.mjs         # lint frontmatter + links + tool references
├── docs/
│   ├── ARCHITECTURE.md             # how freshness, routing, and cost guards work
│   ├── CONTRIBUTING.md             # external contributor guide
│   └── PRINCIPLES.md               # the why
└── .github/workflows/validate.yml  # CI — sync + validate on every PR
```

## Testing philosophy

We do NOT write Node/TypeScript unit tests for skill content. Tests fail to catch what matters (instructive quality, cost accuracy, routing sanity). Instead:

- `scripts/validate-skills.mjs` — catches *mechanical* issues (missing frontmatter, broken markdown links, references to non-existent tools).
- Every PR that adds or changes a playbook must include an **example session transcript** in the PR body showing the skill in action against a real TexAu MCP.
- Periodic eval: a contributor picks 3 random plain-English GTM asks, runs them through Claude Code + this pack, and grades the outputs on (a) tool choice, (b) credit efficiency, (c) output quality.
