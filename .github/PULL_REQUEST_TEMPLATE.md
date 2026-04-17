## What

<!-- One sentence. -->

## Why

<!-- One or two sentences. User pain / MCP change / observation driving this. -->

## Testing

<!--
Paste a transcript of a real Claude Code session exercising the change.
Include the final credit total so reviewers can see the cost path worked.
Redact names / companies if needed.
-->

## Checklist

- [ ] `node scripts/validate-skills.mjs` passes
- [ ] `VERSION` bumped (top-level and/or per-skill frontmatter)
- [ ] `README.md` catalog updated if a skill was added / removed
- [ ] `skills/texau-gtm/SKILL.md` routing table updated if a skill was added / removed
- [ ] Ran against a live TexAu MCP (not just a dry-run)
- [ ] `CHANGELOG.md` entry added under `## [Unreleased]` or the target version
