#!/usr/bin/env node
// Lints every SKILL.md: required frontmatter, semver, name matches dir,
// preflight preamble present, relative SKILL.md links resolve, and tool
// invocations (fn-call style or "MCP tool `x`") exist in mcp-catalog.json.
// Exits non-zero on any failure.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const SKILLS    = join(ROOT, 'skills');
const CATALOG   = join(ROOT, '_lib', 'mcp-catalog.json');

const REQUIRED_FRONTMATTER = ['name', 'version', 'description', 'allowed-tools', 'triggers'];
const PREAMBLE_MARKER      = 'texau-skills-preflight';
const SEMVER_RE            = /^\d+\.\d+\.\d+(-[\w.]+)?$/;

const errors = [];
const warnings = [];

function err (skill, msg) { errors.push(`✗ ${skill}: ${msg}`); }
function warn(skill, msg) { warnings.push(`! ${skill}: ${msg}`); }

if (!existsSync(CATALOG)) {
  console.error(`✗ missing ${CATALOG} — run bin/texau-skills-sync first`);
  process.exit(2);
}
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const knownTools = new Set(catalog.tools.map(t => t.name));

function parseFrontmatter(src) {
  if (!src.startsWith('---\n')) return { ok: false, reason: 'no frontmatter fence' };
  const end = src.indexOf('\n---\n', 4);
  if (end < 0) return { ok: false, reason: 'unterminated frontmatter fence' };
  const block = src.slice(4, end);
  const body  = src.slice(end + 5);
  const out = {};
  let pendingList = null;
  let pendingMultiline = null;
  for (const raw of block.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line === '') continue;
    if (pendingMultiline && (line.startsWith('  ') || line === '')) {
      out[pendingMultiline] = (out[pendingMultiline] || '') + line.trim() + ' ';
      continue;
    } else if (pendingMultiline) {
      pendingMultiline = null;
    }
    if (pendingList) {
      if (line.startsWith('  - ')) { pendingList.push(line.slice(4).trim()); continue; }
      if (line.startsWith('- '))    { pendingList.push(line.slice(2).trim()); continue; }
      pendingList = null;
    }
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (!m) continue;
    const [ , key, val ] = m;
    if (val === '') {
      pendingList = [];
      out[key] = pendingList;
    } else if (val === '|' || val === '|-' || val === '>') {
      pendingMultiline = key;
      out[key] = '';
    } else {
      out[key] = val;
    }
  }
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string') out[k] = out[k].trim();
  }
  return { ok: true, frontmatter: out, body };
}

function inspectSkill(dir) {
  const label    = `skills/${dir}`;
  const skillDir = join(SKILLS, dir);
  const skillMd  = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) return err(label, 'missing SKILL.md');

  const src = readFileSync(skillMd, 'utf8');
  const parsed = parseFrontmatter(src);
  if (!parsed.ok) return err(label, `frontmatter: ${parsed.reason}`);
  const { frontmatter: fm, body } = parsed;

  for (const key of REQUIRED_FRONTMATTER) {
    if (!(key in fm) || (Array.isArray(fm[key]) ? fm[key].length === 0 : !fm[key])) {
      err(label, `missing required frontmatter key: ${key}`);
    }
  }
  if (fm.name && fm.name !== dir)            err(label, `frontmatter name "${fm.name}" does not match directory "${dir}"`);
  if (fm.version && !SEMVER_RE.test(fm.version)) err(label, `version "${fm.version}" is not semver (x.y.z)`);
  if (!body.includes(PREAMBLE_MARKER))        err(label, `missing preflight preamble (grep "${PREAMBLE_MARKER}")`);

  // Only flag unambiguous invocations: `name(` or "MCP tool `name`".
  // Bare backticked identifiers are slot names / JSON keys / CRM fields, not tools.
  const invocationPatterns = [
    /`([a-z_][a-z0-9_]{3,})\(/g,
    /\bMCP tool\s+`([a-z_][a-z0-9_]{3,})`/g,
    /`([a-z_][a-z0-9_]{3,})`\s+MCP tool/g,
  ];
  let m;
  for (const re of invocationPatterns) {
    while ((m = re.exec(body)) !== null) {
      const tok = m[1];
      if (!knownTools.has(tok)) err(label, `invocation "${tok}" is not in mcp-catalog.json`);
    }
  }

  const linkRe = /\]\((\.\.\/[^)]+\/SKILL\.md)\)/g;
  while ((m = linkRe.exec(body)) !== null) {
    const target = resolve(skillDir, m[1]);
    if (!existsSync(target)) err(label, `broken link: ${m[1]}`);
  }
}

const dirs = readdirSync(SKILLS).filter(f => statSync(join(SKILLS, f)).isDirectory());
if (dirs.length === 0) {
  console.error('✗ no skills found under ./skills/');
  process.exit(2);
}
for (const d of dirs) inspectSkill(d);

if (warnings.length > 0) {
  console.log('Warnings:');
  for (const w of warnings) console.log('  ' + w);
  console.log('');
}

if (errors.length > 0) {
  console.error('Errors:');
  for (const e of errors) console.error('  ' + e);
  console.error(`\nFailed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`✓ ${dirs.length} skill(s) validated. ${warnings.length} warning(s).`);
