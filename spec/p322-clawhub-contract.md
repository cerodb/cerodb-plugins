# P322 — ClawHub Publish Contract

> Researched 2026-04-09 against `clawhub` CLI v0.9.0 and OpenClaw docs at
> `~/.openclaw/workspace/node_modules/openclaw/docs/tools/clawhub.md` and
> `~/.openclaw/workspace/node_modules/openclaw/docs/tools/skills.md`.

---

## 1. Overview

ClawHub is the **public skill registry for OpenClaw** at [clawhub.ai](https://clawhub.ai).
A skill is a versioned folder containing a `SKILL.md` file plus any supporting text files.
The CLI (`clawhub`) handles publish, install, update, search, and sync.

---

## 2. SKILL.md Frontmatter Contract

A `SKILL.md` must include **at minimum**:

```markdown
---
name: my-skill-name
description: "One-line summary of what this skill does and when to invoke it."
---
```

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique slug identifier for the skill (e.g. `spec-drive`). Must be URL-safe. |
| `description` | string | Plain-language description shown in registry search results. |

### Optional frontmatter fields

| Field | Default | Description |
|-------|---------|-------------|
| `homepage` | — | URL surfaced as "Website" in the Skills UI. |
| `user-invocable` | `true` | When `true`, the skill is exposed as a user slash command (`/skill-name`). |
| `disable-model-invocation` | `false` | When `true`, skill is excluded from model prompt (only user-invocable). |
| `command-dispatch` | — | Set to `tool` to bypass the model and route directly to a tool. |
| `command-tool` | — | Tool name to invoke when `command-dispatch: tool` is active. |
| `command-arg-mode` | `raw` | For tool dispatch, passes raw args string to the tool. |
| `metadata` | — | Single-line JSON object for gating (see §2a). |

### 2a. Gating via `metadata` (optional)

```markdown
metadata: {"openclaw":{"requires":{"bins":["node"],"env":["MY_API_KEY"]},"emoji":"🦾"}}
```

Fields under `metadata.openclaw`:

| Field | Description |
|-------|-------------|
| `always` | `true` = always include, skip all other gates. |
| `emoji` | Optional emoji shown in macOS Skills UI. |
| `homepage` | URL shown as "Website" in macOS UI. |
| `os` | List of platforms: `darwin`, `linux`, `win32`. |
| `requires.bins` | All binaries must exist on `PATH`. |
| `requires.anyBins` | At least one binary must exist on `PATH`. |
| `requires.env` | Env var must exist or be provided in config. |
| `requires.config` | `openclaw.json` paths that must be truthy. |
| `primaryEnv` | Env var name for `skills.entries.<name>.apiKey`. |
| `install` | Array of installer specs (brew/node/go/uv/download). |

> **Parser constraint**: `metadata` must be a **single-line** JSON object.
> Multi-line YAML objects are not supported by the embedded agent parser.

---

## 3. `clawhub publish` Command

Publish a single skill folder to the registry.

```bash
clawhub publish <path> [options]
```

### Flags

| Flag | Description |
|------|-------------|
| `--slug <slug>` | Registry slug (URL-safe identifier). |
| `--name <name>` | Display name shown in the registry. |
| `--version <version>` | Semver version string (e.g. `1.0.0`). |
| `--changelog <text>` | Changelog text for this version (may be empty). |
| `--tags <tags>` | Comma-separated tags (default: `latest`). |
| `--fork-of <slug[@version]>` | Mark this skill as a fork of an existing one. |

### Example — publish a new skill

```bash
clawhub publish ./plugins/spec-drive/skills/spec-workflow \
  --slug spec-workflow \
  --name "Spec Workflow" \
  --version 1.0.0 \
  --changelog "Initial release" \
  --tags latest
```

### Example — publish an update (patch bump)

```bash
clawhub publish ./plugins/spec-drive/skills/spec-workflow \
  --slug spec-workflow \
  --version 1.0.1 \
  --changelog "Fix: corrected phase transition table"
```

---

## 4. `clawhub sync` Workflow

`sync` scans local skill folders and publishes any new or modified ones.

```bash
clawhub sync [options]
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--root <dir...>` | cwd | Extra scan roots (additional skill directories). |
| `--all` | — | Upload all new/updated skills without prompting. |
| `--dry-run` | — | Show what *would* be uploaded; no changes made. |
| `--bump <type>` | `patch` | Version bump strategy: `patch`, `minor`, or `major`. |
| `--changelog <text>` | — | Changelog text for non-interactive updates. |
| `--tags <tags>` | `latest` | Comma-separated tags to apply. |
| `--concurrency <n>` | `4` | Concurrent registry checks. |

### Sync workflow (step by step)

1. **Authenticate** — `clawhub login` (browser flow) or `clawhub login --token <token>`.
2. **Dry-run first** — verify what would be uploaded:
   ```bash
   clawhub sync --dry-run
   ```
3. **Confirm output** — review the list of detected skill folders and version bumps.
4. **Publish** — run without `--dry-run` to actually publish:
   ```bash
   clawhub sync --all --changelog "Automated sync"
   ```
5. **Verify** — check the registry or run `clawhub list` to confirm installed versions.

### Scan fallback behaviour

`sync` scans `./skills` first. If none are found, it falls back to:
- `~/openclaw/skills`
- `~/.openclaw/skills`

Use `--root` to add extra directories (e.g. `--root ./plugins/spec-drive/skills`).

---

## 5. `.clawhub/lock.json` Format

Installed skills are recorded in `.clawhub/lock.json` under the working directory
(or the OpenClaw workspace root when invoked there).

```json
{
  "version": 1,
  "skills": {
    "<slug>": {
      "version": "1.0.0",
      "installedAt": 1775784105655
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | Lock file schema version (currently `1`). |
| `skills` | object | Map of slug → install metadata. |
| `skills.<slug>.version` | string | Semver version that was installed. |
| `skills.<slug>.installedAt` | number | Unix timestamp (ms) when the skill was installed. |

---

## 6. Authentication

```bash
# Browser flow (opens clawhub.ai in browser)
clawhub login

# Non-interactive (CI / headless)
clawhub login --token <api-token> --no-browser

# Verify current auth
clawhub whoami

# Log out
clawhub logout
```

Token is stored in the CLI config file (override via `CLAWHUB_CONFIG_PATH`).

---

## 7. Global CLI Options

These apply to all commands:

| Option | Description |
|--------|-------------|
| `--workdir <dir>` | Working directory (default: cwd; falls back to OpenClaw workspace). |
| `--dir <dir>` | Skills directory relative to workdir (default: `skills`). |
| `--site <url>` | Override site base URL. |
| `--registry <url>` | Override registry API base URL. |
| `--no-input` | Disable interactive prompts (for CI/automation). |
| `-V, --cli-version` | Print CLI version. |

---

## 8. Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAWHUB_SITE` | Override site URL. |
| `CLAWHUB_REGISTRY` | Override registry API URL. |
| `CLAWHUB_CONFIG_PATH` | Override where the CLI stores auth tokens. |
| `CLAWHUB_WORKDIR` | Override default working directory. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disable install-count telemetry on `sync`. |

---

## 9. Skill Installation Precedence (OpenClaw load order)

When OpenClaw loads skills, precedence is (highest → lowest):

1. `<workspace>/skills` (workspace-local)
2. `~/.openclaw/skills` (managed/local)
3. Bundled skills (shipped with the npm package)

`clawhub install` defaults to workspace-local (`<workspace>/skills/<slug>`).
Use `--workdir ~/.openclaw` to install to the shared managed location.

---

## 10. Publishing Checklist (for cerodb-plugins skills)

Before publishing any skill from this repo:

- [ ] `SKILL.md` has `name` and `description` frontmatter.
- [ ] `name` matches the intended slug (URL-safe, lowercase, hyphens).
- [ ] Version is semver and bumped from the previous published version.
- [ ] `clawhub login` (or `--token`) is active.
- [ ] `clawhub sync --dry-run` shows the expected changes.
- [ ] Changelog text is non-empty for meaningful updates.
- [ ] `--tags latest` is included unless publishing a pre-release.
