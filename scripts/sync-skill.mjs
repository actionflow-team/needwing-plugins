#!/usr/bin/env node
// Regenerate the bundled Needwing skill from the canonical source.
//
// Canonical source (either one):
//   1. The served Skill:            https://needwing.ai/api/connect/skill   (default)
//   2. The Homepage TypeScript source (offline fallback): `apps/portal/src/lib/network-agent-skill.ts`
//      in an af-homepage checkout (exported const `networkAgentSkill`, a template literal), given as
//      the --from-source path or through NEEDWING_HOMEPAGE_DIR
//
// What it writes:
//   plugins/needwing/skills/needwing/SKILL.md   (bundled skill, byte-exact copy)
//   gemini-extension/GEMINI.md                  (derived: skill body without YAML frontmatter)
//   skills.lock.json                            (sha256 of the bundled skill + provenance)
//
// Usage:
//   NODE_USE_ENV_PROXY=1 node scripts/sync-skill.mjs             # fetch from the URL, write
//   NODE_USE_ENV_PROXY=1 node scripts/sync-skill.mjs --check     # fetch from the URL, report drift only
//   node scripts/sync-skill.mjs --from-source <file>             # copy from the TypeScript source, write
//   NEEDWING_HOMEPAGE_DIR=<checkout> node scripts/sync-skill.mjs --from-source
//
// NODE_USE_ENV_PROXY=1 makes Node 24's fetch honor HTTP_PROXY/HTTPS_PROXY, which this
// machine requires for public network access.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_PATH = path.join(root, "plugins/needwing/skills/needwing/SKILL.md");
const GEMINI_PATH = path.join(root, "gemini-extension/GEMINI.md");
const LOCK_PATH = path.join(root, "skills.lock.json");
const SKILL_URL = "https://needwing.ai/api/connect/skill";
const SOURCE_FILE = "apps/portal/src/lib/network-agent-skill.ts";
const DEFAULT_TS_SOURCE = process.env.NEEDWING_HOMEPAGE_DIR
  ? path.join(process.env.NEEDWING_HOMEPAGE_DIR, SOURCE_FILE)
  : undefined;

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const fromSourceIdx = args.indexOf("--from-source");

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Unescape a JavaScript template literal body, left to right (\\, \`, \$, \n, …). */
export function unescapeTemplateLiteral(s) {
  return s.replace(/\\(.)/g, (m, c) => {
    switch (c) {
      case "n": return "\n";
      case "t": return "\t";
      case "r": return "\r";
      case "b": return "\b";
      case "f": return "\f";
      case "v": return "\v";
      case "0": return "\0";
      case "`":
      case "$":
      case "\\": return c;
      default: return m;
    }
  });
}

/** Extract the `networkAgentSkill` template literal from the TypeScript source, unescaped. */
function skillFromTsSource(tsPath) {
  const ts = readFileSync(tsPath, "utf8");
  const match = /export const networkAgentSkill = `([\s\S]*)`;\s*$/.exec(ts);
  if (!match) throw new Error(`networkAgentSkill template literal not found in ${tsPath}`);
  return unescapeTemplateLiteral(match[1]);
}

function validateSkill(text, origin) {
  if (!text.startsWith("---\n")) throw new Error(`${origin}: missing YAML frontmatter`);
  if (!/^name:\s*needwing\s*$/m.test(text)) throw new Error(`${origin}: frontmatter name is not "needwing"`);
  if (!/^description:\s*\S/m.test(text)) throw new Error(`${origin}: frontmatter has no description`);
}

function deriveGeminiMd(skill) {
  const body = skill.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  // The skill body already opens with a "# Needwing" heading; add one only when absent.
  return /^#\s/.test(body) ? `${body}\n` : `# Needwing\n\n${body}\n`;
}

async function fetchServedSkill() {
  if (!process.env.NODE_USE_ENV_PROXY) {
    console.error("note: NODE_USE_ENV_PROXY is unset; if fetch fails behind a proxy, rerun with NODE_USE_ENV_PROXY=1");
  }
  const res = await fetch(SKILL_URL, { headers: { accept: "text/markdown, text/plain; q=0.9, */*; q=0.8" } });
  if (!res.ok) throw new Error(`GET ${SKILL_URL} -> ${res.status}`);
  return res.text();
}

let text;
let origin;
if (fromSourceIdx !== -1) {
  const tsPath = args[fromSourceIdx + 1] ?? DEFAULT_TS_SOURCE;
  if (!tsPath) {
    console.error("--from-source needs a file path or NEEDWING_HOMEPAGE_DIR");
    process.exit(2);
  }
  if (!existsSync(tsPath)) {
    console.error(`source not found: ${tsPath}`);
    process.exit(2);
  }
  text = skillFromTsSource(tsPath);
  origin = `source ${tsPath}`;
} else {
  text = await fetchServedSkill();
  origin = `served skill ${SKILL_URL}`;
}
validateSkill(text, origin);

const before = existsSync(SKILL_PATH) ? sha256(readFileSync(SKILL_PATH, "utf8")) : "(absent)";
const after = sha256(text);

if (checkOnly) {
  if (before !== after) {
    console.log(`DRIFT: bundled SKILL.md ${before} != ${origin} ${after}`);
    console.log("run: NODE_USE_ENV_PROXY=1 node scripts/sync-skill.mjs");
    process.exit(1);
  }
  console.log(`up to date: bundled SKILL.md == ${origin} (${after})`);
  process.exit(0);
}

writeFileSync(SKILL_PATH, text, "utf8");
writeFileSync(GEMINI_PATH, deriveGeminiMd(text), "utf8");

const lock = {
  skill: {
    name: "needwing",
    sourceUrl: SKILL_URL,
    sourceFile: `af-homepage:${SOURCE_FILE}`,
    bundledFile: "plugins/needwing/skills/needwing/SKILL.md",
    derivedFile: "gemini-extension/GEMINI.md",
    sha256: after,
    syncedAt: new Date().toISOString(),
    syncedFrom: origin,
  },
};
writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, "utf8");

console.log(`SKILL.md ${before} -> ${after} (from ${origin})`);
console.log(`GEMINI.md regenerated; skills.lock.json updated.`);
