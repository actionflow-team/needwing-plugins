#!/usr/bin/env node
// Validate every manifest in the needwing-plugins repository. Run via `npm test`.
//
// Checks:
//   1. every JSON manifest parses;
//   2. each manifest carries the fields its format requires;
//   3. every plugin manifest installs the fixed trial endpoint
//      https://needwing.ai/mcp/trial, and server.json lists exactly the two
//      remote addresses (trial + sign-in https://needwing.ai/mcp);
//   4. the bundled SKILL.md matches the sha256 recorded in skills.lock.json, and,
//      when NEEDWING_HOMEPAGE_DIR names an af-homepage checkout, matches its
//      `networkAgentSkill` source byte-for-byte;
//   5. the Cursor install deep link in README.md re-encodes to the expected link and
//      its config decodes to the fixed URL.
//
// No dependencies (Node 24 standard library only).

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MCP_URL = "https://needwing.ai/mcp";
const TRIAL_URL = "https://needwing.ai/mcp/trial";
// The single remote every plugin installs: the trial address works for everyone.
const PLUGIN_URL = TRIAL_URL;
const REGISTRY_SCHEMA = "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json";
const REGISTRY_NAME = "ai.needwing/needwing";
const REPO_URL = "https://github.com/actionflow-team/needwing-plugins";
const PLUGIN_VERSION = "1.1.0";
const SKILL_TS_SOURCE = process.env.NEEDWING_HOMEPAGE_DIR
  ? path.join(process.env.NEEDWING_HOMEPAGE_DIR, "apps/portal/src/lib/network-agent-skill.ts")
  : null;

const passed = [];
const failed = [];

function check(name, condition, detail = "") {
  if (condition) passed.push(name);
  else failed.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function readJson(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) {
    failed.push(`${rel} — file missing`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (err) {
    failed.push(`${rel} — invalid JSON: ${err.message}`);
    return null;
  }
}

function readText(rel) {
  const abs = path.join(root, rel);
  return existsSync(abs) ? readFileSync(abs, "utf8") : null;
}

// --- 1. parse every JSON manifest -------------------------------------------

const marketplace = readJson(".claude-plugin/marketplace.json");
const agentsMarketplace = readJson(".agents/plugins/marketplace.json");
const claudeManifest = readJson("plugins/needwing/.claude-plugin/plugin.json");
const codexManifest = readJson("plugins/needwing/.codex-plugin/plugin.json");
const cursorManifest = readJson("plugins/needwing/.cursor-plugin/plugin.json");
const mcpJson = readJson("plugins/needwing/.mcp.json");
const geminiManifest = readJson("gemini-extension/gemini-extension.json");
const serverJson = readJson("server.json");
const lock = readJson("skills.lock.json");
const pkg = readJson("package.json");

// --- 2a. Claude Code marketplace --------------------------------------------

if (marketplace) {
  check("marketplace.name", marketplace.name === "needwing", JSON.stringify(marketplace.name));
  check(
    "marketplace.owner.name",
    typeof marketplace.owner?.name === "string" && marketplace.owner.name.length > 0,
  );
  const entry = marketplace.plugins?.[0];
  check("marketplace.plugins.length", marketplace.plugins?.length === 1);
  check("marketplace.entry.name", entry?.name === "needwing", JSON.stringify(entry?.name));
  check(
    "marketplace.entry.source",
    entry?.source === "./plugins/needwing",
    JSON.stringify(entry?.source),
  );
  check("marketplace.entry.version", entry?.version === PLUGIN_VERSION, JSON.stringify(entry?.version));
  check("marketplace.entry.license", entry?.license === "MIT", JSON.stringify(entry?.license));
  check(
    "marketplace.entry.repository",
    entry?.repository === REPO_URL,
    JSON.stringify(entry?.repository),
  );
  check(
    "marketplace.entry.keywords",
    Array.isArray(entry?.keywords) && entry.keywords.length > 0,
  );
}

// --- 2b. plugin manifests ----------------------------------------------------

for (const [label, manifest, file] of [
  ["claude", claudeManifest, "plugins/needwing/.claude-plugin/plugin.json"],
  ["codex", codexManifest, "plugins/needwing/.codex-plugin/plugin.json"],
  ["cursor", cursorManifest, "plugins/needwing/.cursor-plugin/plugin.json"],
]) {
  if (!manifest) continue;
  check(`${label}.name`, manifest.name === "needwing", JSON.stringify(manifest.name));
  check(`${label}.version`, manifest.version === PLUGIN_VERSION, JSON.stringify(manifest.version));
  check(
    `${label}.description`,
    typeof manifest.description === "string" && manifest.description.length > 0,
  );
  check(`${label}.author.name`, typeof manifest.author?.name === "string" && manifest.author.name.length > 0);
  if (label === "codex") {
    check("codex.skills", manifest.skills === "./skills/", JSON.stringify(manifest.skills));
    check("codex.mcpServers", manifest.mcpServers === "./.mcp.json", JSON.stringify(manifest.mcpServers));
  }
  if (label === "cursor") {
    check("cursor.skills", manifest.skills === "./skills/", JSON.stringify(manifest.skills));
    const entry = manifest.mcpServers?.needwing;
    check(
      "cursor.mcpServers.needwing.url",
      entry?.url === PLUGIN_URL,
      JSON.stringify(entry?.url),
    );
    check(
      "cursor.mcpServers.needwing.no-credential-header",
      !entry?.headers || Object.values(entry.headers).every((v) => v.startsWith("${")),
      "header values must be ${VAR} placeholders, never literals",
    );
  }
}

// --- 2c. .mcp.json (Claude Code + Codex shared) -------------------------------

if (mcpJson) {
  const entry = mcpJson.mcpServers?.needwing;
  check(".mcp.json.needwing present", Boolean(entry));
  check(
    ".mcp.json.needwing.type",
    entry?.type === "http" || entry?.type === "streamable-http",
    JSON.stringify(entry?.type),
  );
  check(".mcp.json.needwing.url", entry?.url === PLUGIN_URL, JSON.stringify(entry?.url));
  const headerValues = Object.values(entry?.headers ?? {});
  check(
    ".mcp.json.oauth-by-default",
    headerValues.length === 0,
    headerValues.length
      ? "no headers key expected so clients run OAuth; any header value must be a ${VAR} placeholder"
      : "",
  );
  check(
    ".mcp.json.header-values-placeholder-only",
    headerValues.every((v) => v.startsWith("${")),
  );
}

// --- 2d. Gemini CLI extension -------------------------------------------------

if (geminiManifest) {
  check("gemini.name", geminiManifest.name === "needwing", JSON.stringify(geminiManifest.name));
  check("gemini.version", geminiManifest.version === PLUGIN_VERSION, JSON.stringify(geminiManifest.version));
  const entry = geminiManifest.mcpServers?.needwing;
  check("gemini.mcpServers.needwing.httpUrl", entry?.httpUrl === PLUGIN_URL, JSON.stringify(entry?.httpUrl));
  check(
    "gemini.contextFileName",
    geminiManifest.contextFileName === "GEMINI.md",
    JSON.stringify(geminiManifest.contextFileName),
  );
  check("gemini.GEMINI.md present", existsSync(path.join(root, "gemini-extension/GEMINI.md")));
  const geminiMd = readText("gemini-extension/GEMINI.md");
  check("gemini.GEMINI.md mentions the endpoints", Boolean(geminiMd?.includes(PLUGIN_URL) && geminiMd?.includes(MCP_URL)));
}

// --- 2e. MCP Registry server.json ----------------------------------------------

if (serverJson) {
  check("server.json.$schema", serverJson.$schema === REGISTRY_SCHEMA, JSON.stringify(serverJson.$schema));
  check("server.json.name", serverJson.name === REGISTRY_NAME, JSON.stringify(serverJson.name));
  check(
    "server.json.title",
    typeof serverJson.title === "string" && serverJson.title.length > 0,
  );
  check(
    "server.json.description",
    typeof serverJson.description === "string" && serverJson.description.length > 0,
  );
  check("server.json.version", serverJson.version === PLUGIN_VERSION, JSON.stringify(serverJson.version));
  check("server.json.repository.url", serverJson.repository?.url === REPO_URL, JSON.stringify(serverJson.repository));
  const remotes = serverJson.remotes ?? [];
  check("server.json.remotes.length", remotes.length === 2, JSON.stringify(remotes?.map((r) => r.url)));
  check(
    "server.json.remote.trial",
    remotes[0]?.type === "streamable-http" && remotes[0]?.url === TRIAL_URL,
    JSON.stringify(remotes[0]),
  );
  check(
    "server.json.remote.sign-in",
    remotes[1]?.type === "streamable-http" && remotes[1]?.url === MCP_URL,
    JSON.stringify(remotes[1]),
  );
}

// --- 2f. Codex repo marketplace --------------------------------------------------

if (agentsMarketplace) {
  check(
    "agents-marketplace.name",
    typeof agentsMarketplace.name === "string" && agentsMarketplace.name.length > 0,
  );
  check(
    "agents-marketplace.interface.displayName",
    typeof agentsMarketplace.interface?.displayName === "string" &&
      agentsMarketplace.interface.displayName.length > 0,
  );
  const entry = agentsMarketplace.plugins?.[0];
  check(
    "agents-marketplace.entry.source.path",
    entry?.source?.path === "./plugins/needwing",
    JSON.stringify(entry?.source),
  );
}

// --- 2g. package.json -------------------------------------------------------------

if (pkg) {
  check("package.json.test-script", pkg.scripts?.test === "node scripts/validate.mjs", JSON.stringify(pkg.scripts?.test));
  check("package.json.engines.node", /^>=?(24|2[4-9]|[3-9]\d)/.test(String(pkg.engines?.node ?? "")), JSON.stringify(pkg.engines?.node));
  check("package.json.no-dependencies", !pkg.dependencies && !pkg.devDependencies);
}

// --- 3. every MCP URL in the repo is one of the two fixed addresses ----------------

const jsonFiles = [
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
  "plugins/needwing/.claude-plugin/plugin.json",
  "plugins/needwing/.codex-plugin/plugin.json",
  "plugins/needwing/.cursor-plugin/plugin.json",
  "plugins/needwing/.mcp.json",
  "gemini-extension/gemini-extension.json",
  "server.json",
];
const strayUrls = [];
for (const rel of jsonFiles) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) continue;
  // Only `url`/`httpUrl` values inside `mcpServers` or `remotes` are MCP endpoints;
  // homepage/repository URLs elsewhere are expected to differ.
  const visit = (node, inMcpContext) => {
    if (Array.isArray(node)) return node.forEach((v) => visit(v, inMcpContext));
    if (node && typeof node === "object") {
      return Object.entries(node).forEach(([k, v]) => {
        const inside = inMcpContext || k === "mcpServers" || k === "remotes";
        if (inside && (k === "url" || k === "httpUrl") && typeof v === "string" && /^https?:\/\//.test(v) && v !== MCP_URL && v !== TRIAL_URL) {
          strayUrls.push(`${rel}: ${k}=${v}`);
        }
        visit(v, inside);
      });
    }
  };
  visit(JSON.parse(readFileSync(abs, "utf8")), false);
}
check("all-mcp-urls-are-fixed-addresses", strayUrls.length === 0, strayUrls.join("; "));

// --- 4. bundled skill vs skills.lock.json and the Homepage source -----------------

const bundledSkill = readText("plugins/needwing/skills/needwing/SKILL.md");
check("skill.bundled present", Boolean(bundledSkill));
if (bundledSkill) {
  check(
    "skill.frontmatter name",
    /^---\nname:\s*needwing\s*\n/.test(bundledSkill),
  );
  check(
    "skill.frontmatter description",
    /^description:\s*\S/m.test(bundledSkill.slice(0, 2000)),
  );
  if (lock) {
    const actual = createHash("sha256").update(bundledSkill, "utf8").digest("hex");
    check(
      "skill.sha256 matches skills.lock.json",
      lock.skill?.sha256 === actual,
      `lock=${lock.skill?.sha256} actual=${actual}`,
    );
    check(
      "skill.lock bundledFile path",
      lock.skill?.bundledFile === "plugins/needwing/skills/needwing/SKILL.md",
    );
  }
  if (SKILL_TS_SOURCE && existsSync(SKILL_TS_SOURCE)) {
    const ts = readFileSync(SKILL_TS_SOURCE, "utf8");
    const match = /export const networkAgentSkill = `([\s\S]*)`;\s*$/.exec(ts);
    if (match) {
      // Unescape the template literal body exactly as JavaScript would (\\, \`, \$, \n, …).
      const expected = match[1].replace(/\\(.)/g, (m, c) => {
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
      check(
        "skill matches Homepage source byte-for-byte",
        expected === bundledSkill,
        "re-run: node scripts/sync-skill.mjs --from-source (or sync from the served skill after a Homepage release)",
      );
    } else {
      check("skill source export found", false, `no networkAgentSkill literal in ${SKILL_TS_SOURCE}`);
    }
  }
  // The derived Gemini context must track the bundled skill.
  const geminiMd = readText("gemini-extension/GEMINI.md");
  if (geminiMd) {
    const body = bundledSkill.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    check("gemini.GEMINI.md derived from bundled skill", geminiMd.trim() === body || geminiMd.trim() === `# Needwing\n\n${body}`);
  }
}

// --- 5. Cursor deep link in README.md ---------------------------------------------

const readme = readText("README.md");
check("README present", Boolean(readme));
if (readme) {
  const linkPattern =
    /cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=([^&\s)`]+)&config=([^&\s)`]+)/;
  const found = linkPattern.exec(readme);
  check("README contains a Cursor deep link", Boolean(found));
  if (found) {
    const name = decodeURIComponent(found[1]);
    const config = JSON.parse(Buffer.from(decodeURIComponent(found[2]), "base64").toString("utf8"));
    check("cursor-link.name", name === "needwing", name);
    check(
      "cursor-link.config.url",
      config?.url === PLUGIN_URL,
      JSON.stringify(config?.url),
    );
    const expectedB64 = Buffer.from(JSON.stringify(config), "utf8").toString("base64");
    check(
      "cursor-link.config re-encodes exactly",
      decodeURIComponent(found[2]) === expectedB64,
      "base64 payload must be the standard encoding of the JSON config",
    );
  }
  check(
    "README states the first question",
    /Sign in · Create account · Try/.test(readme),
  );
  check("README installs the trial endpoint", readme.includes(TRIAL_URL));
  check("README mentions the sign-in alternative", readme.includes(MCP_URL));
}

// --- report ------------------------------------------------------------------------

for (const line of passed) console.log(`ok   ${line}`);
for (const line of failed) console.log(`FAIL ${line}`);
console.log(`\n${passed.length} passed, ${failed.length} failed`);
if (failed.length > 0) process.exit(1);
