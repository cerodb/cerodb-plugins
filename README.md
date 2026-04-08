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
```

Each plugin directory should contain a self-contained Claude-compatible plugin package.
