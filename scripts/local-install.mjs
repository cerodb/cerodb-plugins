#!/usr/bin/env node
/**
 * local-install.mjs
 *
 * Simulate `clawhub install <slug>` from a local skill directory into a workdir.
 *
 * `clawhub install` fetches from the registry and requires authentication.
 * This script replicates the local steps only (file copy, origin.json, lock.json)
 * so the e2e test can run non-interactively without network or auth.
 *
 * Usage:
 *   node scripts/local-install.mjs <skill-source-path> <workdir>
 *
 * What it does (mirrors cmdInstall in clawhub dist/cli/commands/skills.js):
 *   1. Reads .clawhub/meta.json from <skill-source-path> for slug + version
 *   2. Copies skill files to <workdir>/skills/<slug>/
 *   3. Writes <workdir>/skills/<slug>/.clawhub/origin.json
 *   4. Reads + updates <workdir>/.clawhub/lock.json
 *
 * Exit codes:
 *   0  Success
 *   1  Error (missing args, bad meta.json, copy failed)
 */

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const [, , sourcePath, workdir] = process.argv;

if (!sourcePath || !workdir) {
  console.error("Usage: node scripts/local-install.mjs <skill-source-path> <workdir>");
  process.exit(1);
}

const absSource = resolve(sourcePath);
const absWorkdir = resolve(workdir);

// ── 1. Read meta.json for slug + version ─────────────────────────────────────

const metaPath = join(absSource, ".clawhub", "meta.json");
let meta;
try {
  meta = JSON.parse(await readFile(metaPath, "utf8"));
} catch (err) {
  console.error(`ERROR: Cannot read .clawhub/meta.json from ${absSource}: ${err.message}`);
  process.exit(1);
}

const slug = meta.slug;
const version = meta.version ?? "1.0.0";

if (!slug) {
  console.error("ERROR: .clawhub/meta.json missing required field: slug");
  process.exit(1);
}

// ── 2. Copy skill files to <workdir>/skills/<slug>/ ──────────────────────────

const targetDir = join(absWorkdir, "skills", slug);
await mkdir(targetDir, { recursive: true });
await cp(absSource, targetDir, { recursive: true, force: true });

// ── 3. Write origin.json ─────────────────────────────────────────────────────

const originPath = join(targetDir, ".clawhub", "origin.json");
await mkdir(dirname(originPath), { recursive: true });
await writeFile(
  originPath,
  JSON.stringify(
    {
      version: 1,
      registry: "https://clawhub.dev",
      slug,
      installedVersion: version,
      installedAt: Date.now(),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

// ── 4. Read + update <workdir>/.clawhub/lock.json ────────────────────────────

const lockDir = join(absWorkdir, ".clawhub");
const lockPath = join(lockDir, "lock.json");

let lock = { version: 1, skills: {} };
try {
  const raw = await readFile(lockPath, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed.version === 1 && typeof parsed.skills === "object") {
    lock = parsed;
  }
} catch {
  // start with empty lock
}

lock.skills[slug] = {
  version,
  installedAt: Date.now(),
};

await mkdir(lockDir, { recursive: true });
await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");

console.log(`OK. Installed ${slug}@${version} -> ${targetDir}`);
