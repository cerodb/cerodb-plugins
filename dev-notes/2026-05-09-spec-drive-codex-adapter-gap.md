# Spec-Drive Codex Adapter Gap — 2026-05-09

## Summary

During P361 (`p361-motobot-twitter-analysis-account-evaluation`) Motobot was running in Codex/OpenClaw, but advanced Spec-Drive phases by invoking Claude Code's `/spec-drive:*` plugin commands. This caused avoidable Claude rate-limit dependency and confused the operator model: Spec-Drive is intended to be cross-CLI at the artifact/protocol level, but in this environment the canonical phase-gate execution path is still Claude-native.

## Observed behavior

- P361 requirements were generated successfully through Claude Code `/spec-drive:requirements`.
- P361 design was attempted through Claude Code `/spec-drive:design`.
- First design attempt timed out while the architect agent explored the Dashboard codebase.
- Second design attempt hit Claude's usage limit.
- Codex had access to the same repo/files and could have produced or assisted with design, but OpenClaw's local wrapper guidance says to use the actual Spec-Drive command surface and not hand-create canonical artifacts.

## Expected behavior

In a Codex/OpenClaw session, Spec-Drive should have a Codex-native adapter/runner that can execute the same phase gates without requiring Claude Code as the command runtime.

Minimum expected adapter behavior:

1. Discover active spec via `spec/.spec-drive-state.json`.
2. Validate phase preconditions using the same checklist semantics.
3. Load command prompts from `plugins/spec-drive/commands/`.
4. Load role prompts from `plugins/spec-drive/agents/`.
5. Generate/update canonical artifacts (`requirements.md`, `design.md`, `tasks.md`) with state transitions.
6. Preserve the artifact contract so Claude, Codex, Kiro, and Coda can hand off cleanly.
7. Avoid silently falling back to Claude unless explicitly requested.

## Root cause

The plugin documentation is honest that Codex support is currently "manual adapter" / workflow-pack support, not one-click native install. The operational gap is that OpenClaw's `spec-drive-wrapper` treats the Claude-style command surface as the only canonical execution path.

So this is less "Spec-Drive lied" and more:

- native Claude plugin support exists;
- cross-CLI artifact portability exists;
- Codex/OpenClaw phase execution adapter is missing.

## Proposed fix

Create a Codex/OpenClaw adapter for Spec-Drive phase gates.

Possible implementation options:

### Option A — Thin local runner script

Add a script such as:

```bash
plugins/spec-drive/bin/spec-drive-run <phase> --basePath <spec-dir>
```

The script performs discovery/checklist/state transitions and emits a phase prompt bundle for the current CLI to execute. The model still generates content, but the state mechanics are deterministic and CLI-agnostic.

### Option B — OpenClaw skill adapter

Update `~/.openclaw/workspace/skills/spec-drive-wrapper/SKILL.md` to support Codex/OpenClaw execution:

- If Claude slash commands are available, use them.
- Else if Codex/OpenClaw is active, run the equivalent command prompt + role prompt locally and mark artifacts canonical only after validation.
- Record which runtime generated each phase in `.progress.md`.

### Option C — Native Codex skill packaging

Package Spec-Drive as a Codex skill/plugin with command entry points mapping to the existing `commands/*.md` files and agent roles.

## Acceptance criteria for fix

- From a Codex/OpenClaw session, P361 can run `requirements -> design -> tasks` without invoking `claude`.
- The resulting artifacts pass existing `npm test` and schema validation.
- `.spec-drive-state.json` transitions match Claude plugin behavior.
- `.progress.md` records runtime/adapter used.
- If adapter is unavailable, Motobot reports "Codex adapter missing" rather than burning Claude quota by default.

## Related files

- `plugins/spec-drive/README.md` — Runtime Support / manual adapter note
- `plugins/spec-drive/INSTALL.md` — Codex Installation section
- `plugins/spec-drive/commands/*.md` — phase command specs
- `plugins/spec-drive/agents/*.md` — role prompts
- `~/.openclaw/workspace/skills/spec-drive-wrapper/SKILL.md` — currently routes to Claude-style command surface only

## Triggering conversation

Gab asked: "Spec drive es un plugin cross cli. Si no está andando cross cli podemos reportarlo al developer. Que somos nosotros jejeje"

Verdict: yes, report accepted. The product gap is real: Codex/OpenClaw needs a native adapter so cross-CLI means executable gates, not only portable Markdown artifacts.
