---
spec: pg46-test-spec-drive
phase: evaluation
created: 2026-03-29T23:30:00-03:00
author: Gabriel Simonet (via Claude Code)
---

# Spec-Drive v1.0.0 — Evaluation Report

## 1. What Spec-Drive Is

Spec-Drive is a spec-driven development workflow for coding CLIs. It takes a project through a deterministic artifact chain:

```
idea → research → requirements → design → tasks → execution
```

Each phase produces plain Markdown. Six specialized agents (researcher, product-manager, architect, task-planner, executor, qa-engineer) handle their respective phases. A coordinator orchestrates execution without implementing directly.

- **Repo**: github.com/cerodb/spec-drive (private, MIT)
- **Version**: 1.0.0
- **Language**: 100% Shell (29,565 bytes)
- **Files**: 35+ (6 agents, 9 commands, 3 skills, 6 templates, 1 schema, 5 tests, 2 hooks)
- **Runtime**: Claude Code native, portable to Codex/Kiro/Globant Coda via manual adapter

## 2. Test Results

| Test | Result | Checks |
|------|--------|--------|
| test-structure.sh | PASS | 47/47 |
| test-hooks.sh | PASS | 11/11 |
| test-commands.sh | **FAIL** | Crashes on `head -n -1` (GNU-only) |
| test-schema.sh | PASS | 9/9 |
| test-cross-cli.sh | **FAIL** | Same `head -n -1` bug |

**Root cause**: `head -n -1` (negative line count) is a GNU coreutils extension. macOS ships BSD `head`, which rejects it. Two of five test scripts crash before completing any assertions.

**Fix**: Replace `head -n -1` with `sed '$d'` (POSIX-compliant, removes last line).

**Irony**: A repo whose core selling point is cross-platform portability fails on the most common developer platform.

## 3. Architecture Assessment

### 3.1 What Works Well

**Artifact-first design.** Every phase produces a standalone Markdown file with YAML frontmatter. No hidden session state, no runtime-specific APIs. Another CLI can read the artifacts and continue. This is the right architectural bet for portability.

**Phase checklists.** Before each transition (research→requirements, requirements→design, etc.), the system validates that the predecessor artifact contains required sections and patterns (AC-X.Y identifiers, Executive Summary, etc.). Fail-fast with specific fix suggestions. This prevents the common failure mode where an agent produces an incomplete artifact and the next agent builds on a broken foundation.

**Strict state schema.** `.spec-drive-state.json` is validated against a JSON Schema with `additionalProperties: false`. This prevents state bloat — a real problem in long-running agentic workflows where state files accumulate stale fields across iterations.

**idea.md as first-class artifact.** Capturing vision and constraints in a structured document before research begins gives all downstream agents a stable reference point. Most spec workflows lose the original intent by the time they reach execution.

**Delegation principle formalized.** The coordinator-never-implements rule is documented as an explicit SKILL, not just an implicit convention. This matters because the most common failure mode in agentic execution is the coordinator "helping" by implementing directly, which breaks context isolation and retry semantics.

**Adversarial QA.** The qa-engineer actively scans for mock anti-patterns (mock ratio >70%, snapshot-only tests, happy-path-only coverage). This is narrow but directionally correct — most agentic test generation produces tests that pass but don't verify behavior.

### 3.2 What Doesn't Work

**No post-execution iteration.** There is no refactor command. After executing tasks and discovering that the design was wrong (which happens in 100% of non-trivial projects), the user has no structured path to update requirements→design→tasks based on what was learned. The only option is to re-run individual phase commands manually, losing the context of why the spec changed.

**No epic decomposition.** Features that are too large for a single spec have no decomposition mechanism. The user must manually split them into separate projects with no dependency tracking between specs.

**No multi-spec management.** One active project per directory. No switching, no cross-spec awareness. This limits real-world usage where multiple features are in flight simultaneously.

**No interactive requirement gathering.** The product-manager agent works from idea.md and research.md, but there's no interview framework to ask clarifying questions before generating requirements. This produces generic requirements when the idea is ambiguous.

**Auto mode is all-or-nothing.** The `--auto` flag bypasses ALL approval gates. There's no per-phase override (e.g., auto through analysis but stop before execution). In practice, you want human review on requirements and design but not on research.

**Project discovery is fragile.** The hooks scan multiple paths (cwd, cwd/spec, parent/spec, PROJECT_ROOT) to find active projects. With many projects, this becomes slow and error-prone. The ambiguity detection helps, but the root cause is that project activation should be explicit, not discovered.

### 3.3 The Fundamental Limitation (Shared with All Spec-Driven Systems)

The fresh-context-per-task model trades cohesion for scalability. The executor receives only the task block + `.progress.md`, not the full spec chain. This prevents context window exhaustion on large projects but means the executor doesn't understand the "bigger picture" of what it's building.

When a verify command is trivial (`test -f output.json`), the task passes regardless of code quality. When it's ambitious (`npm test`), it fails for orthogonal reasons. The executor has no judgment to assess whether the implementation actually solves the underlying problem — it only knows if the verify exited 0.

This isn't a bug in Spec-Drive or Ralph Specum. It's an inherent tradeoff of the architecture. Both systems would benefit from a "design-aware verify" phase where the qa-engineer re-reads the design to check semantic correctness, not just mechanical pass/fail.

## 4. Comparison with Ralph Specum

### 4.1 Core Overlap (~80%)

Both systems share:
- 6 identical agent roles
- Same artifact chain (research→requirements→design→tasks→implement)
- Same task format (`- [ ] X.Y [MARKER]` with Do/Files/Traces/Verify/Commit)
- POC-first 5-phase execution
- Iteration limits (maxTaskIterations=5, maxGlobalIterations=100)
- Fresh-context-per-task principle
- Coordinator-never-implements delegation model

### 4.2 Spec-Drive Advantages

| Feature | Impact | Why It Matters |
|---------|--------|---------------|
| Phase checklists | High | Prevents broken artifact chains — fail-fast before wasting tokens |
| idea.md artifact | Medium | Anchors all downstream work to documented intent |
| Strict JSON Schema | Medium | Prevents state corruption in long-running execution |
| Adversarial QA | Medium | Catches mock-heavy tests that pass but don't verify behavior |
| Bundled test suite | Medium | Self-validates plugin integrity — essential for distribution |
| Auto mode | Low-Medium | Useful for prototypes and CI, dangerous for production features |
| Cross-CLI docs | Low | Correct aspiration, incomplete execution (no native adapters yet) |

### 4.3 Ralph Specum Advantages

| Feature | Impact | Why It Matters |
|---------|--------|---------------|
| Refactor command | Critical | Only way to iterate specs after execution learnings — happens every project |
| Epic triage | High | Large features need decomposition — without it, users create monolith specs |
| Spec indexing | Medium | Component discovery prevents reinvention across specs |
| Multi-spec switching | Medium | Real teams have multiple features in flight |
| Interview framework | Medium | Clarifying questions before requirements prevents generic specs |
| Recovery mode / fixTaskMap | Medium | Targeted retry is better than blind iteration counter |
| Broader command surface | Low-Medium | 14 vs 9 commands — more operational flexibility |

### 4.4 Usability Verdict

| Scenario | Ralph | Spec-Drive | Winner |
|----------|-------|-----------|--------|
| New feature in existing codebase (S/M) | Works | Works | Tie |
| Large feature with discovery (L/XL) | Better (refactor, triage) | Limited | Ralph |
| Disposable prototype | OK | Better (auto mode) | Spec-Drive |
| Greenfield cross-CLI project | Limited | Better (portability) | Spec-Drive |
| Team using multiple CLIs | Not designed for this | Designed for this | Spec-Drive |
| Post-execution iteration | Good (refactor) | Manual re-run only | Ralph |
| Multi-feature coordination | Good (switch, triage) | Single project | Ralph |

**Summary**: Spec-Drive is a solid v1 that hasn't been battle-tested. Its guardrails are stricter and more defensive, which is correct for a portable product. But it lacks the operational maturity that Ralph gained through real usage — specifically refactor, triage, and recovery mechanisms. For non-trivial projects, Ralph is more usable today. For cross-CLI distribution, Spec-Drive has the right foundation but needs the missing features.

## 5. Quality Dimensions

### 5.1 Code Quality
- Shell scripts are clean and well-structured
- Agent prompts are thorough with clear contracts
- Templates are consistent with YAML frontmatter conventions
- Test coverage is good in structure/schema/hooks, weak in runtime behavior

### 5.2 Documentation Quality
- README and INSTALL are clear and honest about runtime support levels
- Agent prompts double as specs (each has clear inputs, outputs, constraints)
- Cross-CLI adapter instructions are practical but incomplete (no native adapters shipped)

### 5.3 Security Posture
- Path validation against approved project root
- Unsafe verify command rejection (rm -rf, sudo, curl|sh, eval)
- Ambiguous project detection prevents accidental cross-project execution
- Deletion guards with explicit confirmation
- No credentials or secrets in repo

### 5.4 Distribution Readiness
- MIT license, clean repo, no dependencies
- Plugin manifest exists but is minimal (doesn't declare commands/agents/hooks)
- Test suite provides install validation
- macOS test failures block adoption on the most common platform

## 6. Conclusion

Spec-Drive v1.0.0 is architecturally sound but operationally incomplete. It makes the right bets on artifact-first design, strict validation, and cross-CLI portability. Its phase checklists, adversarial QA, and strict schema are genuinely better than the incumbent (Ralph Specum).

However, it ships without the features that matter most for real-world usage: post-execution refactoring, epic decomposition, multi-spec management, and interactive requirement gathering. These aren't nice-to-haves — they're the difference between a tool that works for demos and one that works for production development.

The macOS test failure, while trivial to fix, signals that v1 was validated in a controlled environment rather than in the hands of real users. The cross-CLI portability story is aspirational — no native adapters exist for Codex, Kiro, or Coda.

**Rating**: 7/10 as architecture, 5/10 as usable product. The gap is bridgeable with focused work on the missing operational features.
