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

Skills for the OpenClaw ClawHub registry live in `skills/`. This is a separate distribution channel from the Claude Code plugin channel.

| Channel | Install mechanism | Users |
|---------|-------------------|-------|
| `plugins/` | `claude mcp add` or marketplace | Claude Code |
| `skills/` | `clawhub install <slug>` | OpenClaw |

Skills follow the wrapper-vs-native strategy documented in `spec/p322-adr-001-wrapper-vs-native.md`.

See [`skills/README.md`](skills/README.md) for full documentation on the ClawHub distribution model.
