#!/usr/bin/env node
/**
 * dry-run-local.mjs
 *
 * Local simulation of `clawhub sync --dry-run`.
 *
 * clawhub sync --dry-run requires authentication (calls /whoami before scanning).
 * This script replicates the local-scan phase only: it inspects skills/ subdirs,
 * reads SKILL.md frontmatter and .clawhub/meta.json, and outputs what clawhub
 * would show in its "To sync" section for a first-publish scenario.
 *
 * Usage:
 *   node scripts/dry-run-local.mjs [--root <dir>]
 *
 * Exit codes:
 *   0  All required fields present, dry-run would succeed
 *   1  One or more skills are missing required fields
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(process.argv[2] === "--root" ? process.argv[3] : ".");
const SKILLS_DIR = join(ROOT, "skills");

// ── helpers ───────────────────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const result = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = value;
  }
  return result;
}

async function isDir(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function countFiles(dir) {
  try {
    const entries = await readdir(dir, { recursive: true });
    return entries.length;
  } catch {
    return 0;
  }
}

// ── scan ──────────────────────────────────────────────────────────────────────

async function scanSkills(skillsDir) {
  let entries;
  try {
    entries = await readdir(skillsDir);
  } catch {
    return { skills: [], errors: [`skills/ directory not found at ${skillsDir}`] };
  }

  const skills = [];
  const errors = [];

  for (const name of entries.sort()) {
    const folder = join(skillsDir, name);
    if (!(await isDir(folder))) continue;

    const skillMdPath = join(folder, "SKILL.md");
    const metaPath = join(folder, ".clawhub", "meta.json");

    let skillMdContent = null;
    let meta = null;

    try {
      skillMdContent = await readFile(skillMdPath, "utf8");
    } catch {
      errors.push(`${name}: missing SKILL.md`);
      continue;
    }

    const fm = parseFrontmatter(skillMdContent);

    try {
      meta = JSON.parse(await readFile(metaPath, "utf8"));
    } catch {
      // meta.json optional for local scan
    }

    const slug = meta?.slug ?? fm.name ?? name;
    const displayName = meta?.name ?? slug;
    const version = meta?.version ?? "1.0.0";
    const description = meta?.description ?? fm.description ?? "";
    const fileCount = await countFiles(folder);

    const missing = [];
    if (!fm.name) missing.push("SKILL.md: name");
    if (!fm.description) missing.push("SKILL.md: description");
    if (!slug) missing.push("slug");

    skills.push({ slug, displayName, version, description, fileCount, folder, missing });
    if (missing.length > 0) {
      errors.push(`${slug}: missing required fields: ${missing.join(", ")}`);
    }
  }

  return { skills, errors };
}

// ── output ────────────────────────────────────────────────────────────────────

function printSection(title, body) {
  if (!body?.trim()) {
    console.log(title);
    return;
  }
  if (body.trim().includes("\n")) {
    console.log(`\n${title}\n${body.trim()}`);
  } else {
    console.log(`${title}: ${body.trim()}`);
  }
}

function formatActionableLine(skill) {
  return `${skill.slug}  NEW  (${skill.fileCount} files)`;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("┌  ClawHub sync (LOCAL SIMULATION — no registry contact)");
  console.log("");

  const { skills, errors } = await scanSkills(SKILLS_DIR);

  if (skills.length === 0 && errors.length > 0) {
    console.error("Error: No skills found.");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  const rootLabel = SKILLS_DIR.replace(process.env.HOME ?? "", "~");
  printSection("Roots with skills", rootLabel);

  const actionable = skills.filter((s) => s.missing.length === 0);
  const invalid = skills.filter((s) => s.missing.length > 0);

  if (invalid.length > 0) {
    console.log("\nSkills with missing required fields:");
    for (const s of invalid) {
      console.log(`  ✗ ${s.slug}: ${s.missing.join(", ")}`);
    }
  }

  if (actionable.length === 0) {
    console.log("\nNo skills ready to publish.");
    process.exit(1);
  }

  const bulletLines = actionable.map(formatActionableLine).map((l) => `- ${l}`).join("\n");
  printSection("To sync", bulletLines);

  console.log(`\n└  Dry run: would upload ${actionable.length} skill(s).`);

  if (errors.length > 0) {
    console.error("\n⚠  Validation errors found:");
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
