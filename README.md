# cerodb Plugins

Marketplace/distribution repo for Claude-compatible plugins published by `cerodb`.

This repo is intentionally separate from the source/development repos.

Current model:

- source repos:
  - `spec-drive`
  - `think-tank`
- distribution repo:
  - `cerodb-plugins`

## Purpose

This repo exists so users can install plugins through a marketplace flow instead of:

- cloning source repos blindly
- guessing runtime-specific install steps
- editing internal Claude runtime JSON files by hand

## Current status

This repo is being scaffolded as the future canonical install surface.

The first target plugin is:

- `spec-drive`
- `think-tank`

Additional plugins can be added later under:

- `plugins/<plugin-name>/`

## Structure

```text
.claude-plugin/
  marketplace.json
plugins/
  spec-drive/
  think-tank/
skills/
  <slug>/
    SKILL.md
```

Each plugin directory should contain a self-contained Claude-compatible plugin package.

## ClawHub Skills

Skills for the OpenClaw ClawHub registry live in `skills/`. This is a **separate distribution channel** from the Claude Code plugin channel.

### Two install paths — which one do you need?

| Channel | Directory | Install command | Runtime |
|---------|-----------|-----------------|---------|
| **Claude Code plugin** | `plugins/<name>/` | `claude mcp add --transport http <url>` or marketplace | Claude Code (VS Code, IDE, web) |
| **ClawHub skill registry** | `skills/<slug>/` | `clawhub install <slug>` | OpenClaw gateway |

**Claude Code plugin install** — ships a full plugin package (agent prompts, tool schemas, commands). Requires Claude Code. Use when you work with the Claude IDE extension or `claude` CLI directly.

**ClawHub skill install** — ships a lean `SKILL.md` invocation stub that OpenClaw loads at runtime. Use when you run OpenClaw as your AI gateway and want skills available across all models routed through it.

The two channels are independent: you can install a plugin without a skill and vice versa. For the full experience, install both.

### Available skills

#### think-tank

Multi-agent collaboration with debate, review, brainstorm, hypothesis, cross-agent, and help modes.

```bash
clawhub install think-tank
```

**What it does:** Wraps the `think-tank` plugin's `orchestrator.mjs` as a ClawHub skill. Provides all six modes as a single skill entry point. Requires the `think-tank` plugin to be installed at `$THINK_TANK_DIR` (default: `~/ai-Projects/think-tank/plugins/think-tank`).

**Prerequisites:** Node.js (`node` on PATH), think-tank plugin installed.

#### spec-drive

Spec-driven development workflow covering research, requirements, design, tasks, and execution phases.

Install the plugin first in a Claude-compatible runtime:

```text
/plugin marketplace add cerodb/cerodb-plugins
/plugin install spec-drive@cerodb
```

Optional ClawHub wrapper skill:

```bash
clawhub install spec-drive
```

**What it does:** Wraps the `spec-drive` plugin's slash commands as a ClawHub skill. Covers all nine commands (`new`, `research`, `requirements`, `design`, `tasks`, `implement`, `status`, `cancel`, `help`). Requires the `spec-drive` plugin to be installed.

**Prerequisites:** Node.js (`node` on PATH), spec-drive plugin installed.

### Strategy

Skills follow the **wrapper-vs-native** strategy documented in [`spec/p322-adr-001-wrapper-vs-native.md`](spec/p322-adr-001-wrapper-vs-native.md):

- **Wrapper skills** — thin stubs that delegate to an installed plugin script. Logic lives in the plugin; the skill is a discovery and invocation shim.
- **Native skills** — self-contained `SKILL.md` files where the entire skill IS the prompt or instruction text.

See [`skills/README.md`](skills/README.md) for the full ClawHub distribution model and publish workflow.
