# Contributing

## Setup

```bash
git clone https://github.com/texau/texau-gtm-skills.git
cd texau-gtm-skills
./setup
```

Confirm:
```bash
node scripts/validate-skills.mjs   # should print "✓ 9 skill(s) validated."
./bin/texau-skills-preflight       # should emit KEY: value pairs
```

## How to add a new skill

1. Pick a clear, scoped purpose. One skill = one outcome. If your idea has three outcomes, it's three skills.

2. Scaffold:
   ```bash
   mkdir -p skills/<your-skill>
   cp skills/pre-meeting-briefing/SKILL.md skills/<your-skill>/SKILL.md
   ```

3. Rewrite the frontmatter:
   ```yaml
   ---
   name: <your-skill>
   version: 1.0.0
   description: |
     <One paragraph. What the skill does, when to invoke it, and the specific
     user phrases that should trigger it. This is what Claude matches against —
     be literal about trigger conditions.>
   benefits-from: [texau-gtm, <other-skills-this-chains-with>]
   allowed-tools:
     - Bash
     - Read
     - Write
     - Edit
     - AskUserQuestion
   triggers:
     - <plain-English user phrase 1>
     - <phrase 2>
     - <phrase 3>
   ---
   ```

4. Rewrite the body. Mandatory sections (in order):
   1. **Preamble** — copy from any existing skill. `bin/texau-skills-preflight` call + interpretation of the KEY: values.
   2. **Phase 0** — gather inputs. Ask clarifying questions only when truly necessary.
   3. **Phases 1..N** — the actual workflow. Each phase names its tool, cost, and decision criteria.
   4. **Cost ceiling** — total expected spend + gate threshold.
   5. **Anti-patterns** — what NOT to do, with the reason.
   6. **Follow-ups** — which adjacent skills to offer at the end.

5. Wire it into the router:
   - Add a row to the routing table in `skills/texau-gtm/SKILL.md`.
   - Add a row to the skill catalog in `README.md`.

6. Validate:
   ```bash
   node scripts/validate-skills.mjs
   ```

   Fix every error. Warnings are advisory — address them or add intentional exemptions.

7. Test against a real TexAu MCP. In Claude Code:
   ```
   /texau-gtm
   (describe your test case — e.g. "Try my new skill on X")
   ```
   Capture the transcript. Attach it to the PR.

8. Version-bump. Update `VERSION` (top-level) and the skill's own `version:` in frontmatter.

## How to update when the MCP changes

MCP ships a new tool (e.g. `enrich_phone_bulk`):

1. `./bin/texau-skills-sync` — refreshes `_lib/mcp-catalog.json`. New tool lands as `category: "uncategorized"`.
2. Edit `_lib/mcp-catalog.json` — add `category`, `credits`, `billing`, `followup`, `bulk_variant`, `max_batch` as appropriate.
3. Decide: does this tool belong in an existing skill, or does it warrant a new one?
   - **Existing skill**: update the skill's body to mention it. Version-bump the skill.
   - **New skill**: scaffold per the section above.
4. Update `_lib/mcp-catalog.json → decision_tree` if the new tool changes how we pick between alternatives.
5. Bump top-level `VERSION`. PR.

MCP removes a tool:

1. `./bin/texau-skills-sync` — the removed tool stays in the catalog as a ghost. Manually remove it.
2. `grep -r <tool_name> skills/` — find every skill that references it. Update or remove those references.
3. Bump affected skill versions + top-level `VERSION`. PR.

MCP changes a credit cost:

1. Sync.
2. Any skill that cites the old cost inline needs updating. Run `grep -rn <old_cost> skills/`.
3. Most skills cite costs only via the catalog ref. Those auto-update.
4. Bump top-level `VERSION`. PR.

## PR template

```markdown
## What
<1 sentence>

## Why
<1-2 sentences — what user pain / MCP change / observation drove this>

## Testing
<Transcript of a real Claude Code session exercising the change, with cost accounting at the end>

## Checklist
- [ ] `node scripts/validate-skills.mjs` passes
- [ ] `VERSION` bumped (top-level and/or per-skill)
- [ ] `README.md` skill catalog updated (if skill added/removed)
- [ ] `skills/texau-gtm/SKILL.md` routing table updated (if skill added/removed)
- [ ] Ran against real TexAu MCP (not just dry-run)
```

## Code of the house

1. **Skills are content, not code.** Resist the urge to add runtime logic. If logic is needed, it goes in `bin/*` as a plain bash script.
2. **Bash, not Node, for `bin/*`.** Latency matters; every skill spawns a preflight.
3. **No new dependencies without a good reason.** We depend on `bash`, `curl`, `jq`. That's it. Adding `yq`, `python`, `npm install`-something makes the install a chore.
4. **Write for agents, not humans.** A skill is not an essay. It's a playbook an LLM follows. Prefer imperative sentences, numbered steps, and decision tables.
5. **Cost transparency is a first-class concern.** A skill that orchestrates cheaply is better than one that's technically more accurate but 3× the spend.

## What we'll reject

- Skills that hard-code tool names or costs without reading from the catalog.
- Skills that don't gate on cost at the 20-credit threshold.
- Skills that chain tools silently without user confirmation on the big steps.
- Skills that duplicate functionality of an existing skill with minor variations.
- PRs that change the preflight contract without updating every skill that consumes it.

## Questions

Open a GitHub issue with the `question` label. Or email gtm-skills@texau.com.
