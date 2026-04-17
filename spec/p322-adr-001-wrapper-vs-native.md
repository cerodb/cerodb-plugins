# ADR-001: Wrapper vs Native Skill Strategy for ClawHub Packaging

**Status:** Accepted
**Date:** 2026-04-09
**Context:** P322 — OpenClaw ClawHub Skills Packaging

---

## Context

The `cerodb-plugins` repo ships two plugin families — `think-tank` and `spec-drive` — each containing complex multi-agent orchestration logic. Both need to be discoverable and installable via the ClawHub skill registry. Two packaging strategies are viable:

- **Option A — Wrapper skills**: Thin `SKILL.md` files that reference a locally-installed plugin. The skill is a discovery shim; actual logic lives in the plugin binary/scripts.
- **Option B — Native standalone skills**: Self-contained `SKILL.md` files with embedded scripts or complete prompt text. No external plugin installation required.

### Reference Implementation

The existing `plugins/think-tank/codex-skill/SKILL.md` (`ask-claude`) demonstrates the **wrapper pattern**:

```markdown
---
name: ask-claude
description: Delegate a question to Claude Code CLI and return the response
---

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" cross-agent --target claude --topic "$PROMPT"
```
```

The skill itself is ~10 lines. All logic lives in `orchestrator.mjs`. The skill file is a pointer, not an implementation.

The spec-drive native skills (`spec-workflow`, `communication-style`, `delegation-principle`) are pure markdown documents — agent instructions embedded directly in `SKILL.md` with no external script references. These are **native** skills.

---

## Decision

**Adopt the wrapper strategy (Option A) as the primary packaging pattern for ClawHub distribution.**

Skills published to ClawHub will be thin wrappers that delegate to installed plugin logic. Pure-markdown instruction skills (like the existing spec-drive skills) remain native but are published as-is — they are already complete without external scripts.

The practical rule:

| Skill type | Strategy | Rationale |
|---|---|---|
| Orchestration / multi-agent (think-tank modes, spec-drive commands) | **Wrapper** | Logic belongs in the plugin, not the skill |
| Agent instruction / prompt text (spec-drive communication-style, etc.) | **Native** | Already self-contained; no external dep |

---

## Trade-offs

### Option A — Wrapper

**Advantages:**
1. **Single source of truth** — plugin logic lives in one place (`orchestrator.mjs`, agent command files). Updating the plugin automatically improves every skill without a registry re-publish.
2. **Thin registry footprint** — `SKILL.md` is small and human-readable. No duplication of complex orchestration logic across skill and plugin.
3. **Aligns with the established pattern** — `codex-skill/SKILL.md` already proves this works; the wrapper skill has been in production use.
4. **Plugin version independence** — the skill can reference the latest installed plugin version dynamically via env vars (e.g. `$THINK_TANK_DIR`).

**Disadvantages:**
1. **Requires prior plugin installation** — a user who installs a wrapper skill via `clawhub install` must also separately install the plugin. Creates a two-step onboarding friction.
2. **Path coupling** — wrapper skills hardcode default paths (e.g. `$HOME/ai-Projects/think-tank`). If the user installs to a non-standard location, the skill fails unless they set env vars.

### Option B — Native

**Advantages:**
1. **Zero external dependencies** — `clawhub install` gives the user a fully working skill. No companion plugin install required.
2. **Registry-complete** — everything needed is in the skill folder; easier to audit, fork, and version independently.

**Disadvantages:**
1. **Logic duplication** — complex orchestration (multi-agent coordination, branching, state files) would need to be duplicated or inlined into `SKILL.md`. Maintenance burden doubles.
2. **Divergence risk** — native skills that embed logic can drift from the plugin implementation. Two copies, two bugs.

---

## Rationale

The plugins in this repo (`think-tank`, `spec-drive`) have significant orchestration logic in `.mjs` scripts and agent command files. Embedding that logic into skills would create a maintenance anti-pattern where fixes must be applied in two places.

The wrapper pattern is the right fit because:
- Skills are discovery and invocation layers, not implementations.
- The ClawHub contract (`SKILL.md` frontmatter + body) is designed for short, invocable skill definitions — not full program embedding.
- The `ask-claude` skill (codex-skill) has validated this approach in production: it wraps `orchestrator.mjs` and works reliably when the plugin is installed.

For skills whose entire content IS the prompt/instructions (native spec-drive skills), there is nothing to wrap — they publish as native skills naturally.

---

## Rollout Plan

### Phase 1 — Think Tank wrapper skills (first to build)

Wrap the four primary think-tank modes as separate ClawHub skills:

| Skill slug | Wraps | Priority |
|---|---|---|
| `think-tank-debate` | `think-tank debate` command | High |
| `think-tank-review` | `think-tank review` command | High |
| `think-tank-brainstorm` | `think-tank brainstorm` command | Medium |
| `think-tank-cross-agent` | `think-tank cross-agent` command | Medium |

Each skill lives in `plugins/think-tank/skills/<slug>/SKILL.md`.

### Phase 2 — Spec-drive skills (already native, package as-is)

Publish the existing native skills:

| Skill slug | Source path |
|---|---|
| `spec-workflow` | `plugins/spec-drive/skills/spec-workflow/` |
| `delegation-principle` | `plugins/spec-drive/skills/delegation-principle/` |
| `communication-style` | `plugins/spec-drive/skills/communication-style/` |

These require no changes — run `clawhub publish` against existing dirs.

### Phase 3 — Smoke-test install round-trip

1. `clawhub sync --dry-run` against all skill dirs.
2. Install each skill in a test workspace: `clawhub install <slug>`.
3. Verify skill appears in OpenClaw and can be invoked.
4. Document any env var requirements in each skill's `INSTALL.md`.

---

## Verification

```bash
# Confirm Decision section exists
grep -q "Decision" spec/p322-adr-001-wrapper-vs-native.md && echo OK

# Confirm Rollout Plan exists
grep -q "Rollout Plan" spec/p322-adr-001-wrapper-vs-native.md && echo OK
```
