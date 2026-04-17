---
spec: pg46-test-spec-drive
phase: plan
created: 2026-03-29T23:30:00-03:00
author: Gabriel Simonet (via Claude Code)
target-audience: spec-drive developer
---

# Spec-Drive Improvement Plan — How to Beat Every Incumbent

This document is a concrete plan for taking Spec-Drive from "solid v1" to "definitively better than Ralph Specum and every other spec-driven workflow plugin." It's organized by measurable dimension, with specific actions, expected impact, and suggested priority.

The benchmark is Ralph Specum — a mature, battle-tested spec workflow plugin running in production on Claude Code. Spec-Drive already wins on some dimensions (checklists, schema strictness, adversarial QA). This plan targets the dimensions where it loses or ties.

---

## Dimension 1: Post-Execution Iteration

**Current state**: No refactor capability. After execution reveals design flaws, the user must manually re-run phase commands and mentally track what changed and why.

**Why this matters**: Every non-trivial project discovers design problems during implementation. A spec workflow without iteration support is a one-shot tool. One-shot tools get abandoned after the first real project.

**Actions**:

1. **Add `/spec-drive:refactor` command.** This command reads `.progress.md` learnings + completed task results, then walks the user through updating requirements → design → tasks in sequence. Each update should diff against the previous version and document why it changed.

2. **Add `requirements_sha` and `design_sha` to state.** When refactor detects that requirements changed, it invalidates downstream artifacts and flags which tasks need re-planning. This prevents the common bug of executing stale tasks after a design change.

3. **Preserve artifact history.** Before overwriting `requirements.md` during refactor, copy the previous version to `requirements.v1.md` (or use git tags). The refactor agent should reference both versions to produce a coherent delta, not a clean-room rewrite.

4. **Add `learnings_digest` to state.** After execution, summarize the top 3-5 learnings from `.progress.md` into a structured field that the refactor agent can use as input without reading the full progress file.

**Measurable outcome**: A user can complete execution, discover a design flaw, run `/spec-drive:refactor`, and get updated tasks that address the flaw — without starting over. Measure: time-to-iterate vs. manual re-run. Target: <30% of original spec generation time.

---

## Dimension 2: Epic Decomposition

**Current state**: No way to break a large feature into multiple dependent specs. Users either create monolith specs (which exhaust context and produce poor results) or manually split into independent projects (which loses dependency tracking).

**Actions**:

1. **Add `/spec-drive:triage` command.** Input: a large idea or feature description. Output: a dependency graph of 2-5 smaller specs, each with its own `idea.md`, ordered by dependency. The triage agent should identify shared interfaces and data contracts between specs.

2. **Add `epic.json` at project root level.** Schema:
   ```json
   {
     "epicName": "large-feature",
     "specs": [
       {"name": "spec-a", "dependsOn": [], "status": "completed"},
       {"name": "spec-b", "dependsOn": ["spec-a"], "status": "execution"},
       {"name": "spec-c", "dependsOn": ["spec-a", "spec-b"], "status": "pending"}
     ]
   }
   ```

3. **Dependency-aware execution.** `/spec-drive:implement` should check `epic.json` before starting — if a dependency spec isn't completed, block with a clear message instead of producing code that assumes interfaces that don't exist yet.

4. **Epic status roll-up.** `/spec-drive:status` should detect `epic.json` and show aggregate progress across all specs in the epic.

**Measurable outcome**: A feature that would be XL as a single spec can be triaged into 3-4 M specs with tracked dependencies. Measure: successful completion rate of L/XL features. Target: >80% completion (vs. <50% for monolith specs).

---

## Dimension 3: Multi-Spec Management

**Current state**: One active project per working directory. No switching, no cross-spec awareness. Real development involves multiple features in flight.

**Actions**:

1. **Add `/spec-drive:switch` command.** Lists all projects under PROJECT_ROOT, shows their phase/status, lets user activate one. Write active project to `~/.spec-drive-active.json` (not cwd-dependent).

2. **Add `/spec-drive:list` command.** Shows all projects with phase, task progress, last activity timestamp. Sort by last activity. This replaces the current project discovery heuristic with explicit management.

3. **Refactor project discovery.** Remove the multi-path scanning logic from hooks. Instead, read `~/.spec-drive-active.json` for the active project. If no active project, prompt user to select or create one. Explicit activation > implicit discovery.

4. **Cross-spec search.** When the architect is designing a component, allow searching other completed specs for similar components, interfaces, or patterns. This prevents reinventing what was already built in another spec.

**Measurable outcome**: User can manage 5+ concurrent specs without confusion. Measure: zero accidental cross-project execution incidents. Target: project switching in <3 seconds.

---

## Dimension 4: Interactive Requirement Gathering

**Current state**: Product-manager agent generates requirements from idea.md and research.md without asking clarifying questions. This produces generic requirements when the idea is ambiguous.

**Actions**:

1. **Add interview mode to requirements phase.** Before generating requirements, the product-manager asks 3-5 targeted questions derived from ambiguities in idea.md and open questions in research.md. User answers are appended to a `clarifications.md` artifact that becomes input for requirements generation.

2. **Make interview optional.** In auto mode, skip interview and generate best-effort requirements. In normal mode, default to interview. Add `--no-interview` flag for users who want to skip.

3. **Apply interview to design phase too.** The architect should ask about technical preferences (stack choices, deployment target, performance budget) when research.md doesn't resolve them.

4. **Persist interview answers.** `clarifications.md` becomes part of the artifact chain. Future refactor cycles can reference original user intent without re-asking.

**Measurable outcome**: Requirements generated after interview have higher acceptance rate on first review. Measure: percentage of requirements approved without changes. Target: >70% (vs. ~40% without interview).

---

## Dimension 5: Execution Reliability

**Current state**: Iteration counters (taskIteration, globalIteration) with blind retry on failure. No diagnosis of why a task failed, no targeted fix strategy, no distinction between environmental failures and logic errors.

**Actions**:

1. **Add failure classification.** When executor reports failure, classify it:
   - `env_error`: command not found, permission denied, timeout → retry with environment fix
   - `logic_error`: test assertion failed, wrong output → retry with implementation fix
   - `design_error`: task is impossible given current codebase state → escalate to refactor
   - `verify_error`: verify command itself is broken → fix verify, don't fix implementation

2. **Add `fixTaskMap` to state.** When a task fails with `logic_error`, record what was tried and what failed. On retry, the executor receives this map as additional context, preventing the same fix from being attempted twice.

3. **Add design-aware verification.** After mechanical verify passes, qa-engineer re-reads the relevant design.md component section and checks whether the implementation semantically matches the design intent — not just whether the command exited 0.

4. **Add progressive context escalation.** On first retry, executor gets task block + progress (current behavior). On second retry, add the relevant design.md section. On third retry, add requirements.md context. This balances fresh-context efficiency with diagnostic depth.

5. **Add circuit breaker pattern.** If 3 consecutive tasks fail in the same phase, stop execution and suggest refactor instead of continuing to burn tokens on a broken foundation.

**Measurable outcome**: Fewer wasted retries, faster convergence to working code. Measure: average retries per task. Target: <1.5 retries/task (vs. current ~2.5 when failures occur).

---

## Dimension 6: Cross-CLI Portability (Already Strong — Make It Definitive)

**Current state**: Artifact-first design is correct. No native adapters exist for Codex, Kiro, or Coda. Cross-CLI test validates artifact independence but crashes on macOS.

**Actions**:

1. **Fix macOS tests immediately.** Replace all `head -n -1` with `sed '$d'`. This is a 5-minute fix that unblocks adoption on the most common platform. Ship it today.

2. **Ship a Codex adapter.** Create `adapters/codex/` with:
   - Agent prompt wrappers that map Spec-Drive agents to Codex's prompt format
   - A state-resume mechanism using Codex's native tool surface
   - An install script that wires commands into Codex's slash-command system
   - A test script that validates the adapter

3. **Ship a CODA adapter.** Create `adapters/coda/` with equivalent wiring for Globant Coda CLI. This is the enterprise play — Coda is the internal SDLC tool at Globant.

4. **Add adapter validation to test suite.** `test/test-adapters.sh` should validate that each adapter exposes the 9 commands and 6 agents, and that a sample artifact round-trips correctly.

5. **Enrich plugin manifest.** `.claude-plugin/plugin.json` should declare commands, agents, and hooks explicitly. This enables runtime auto-discovery instead of relying on filesystem convention.

**Measurable outcome**: Spec-Drive installs and runs on Claude Code, Codex, and Coda with native adapters. Measure: adapter installation success rate. Target: >95% on supported platforms.

---

## Dimension 7: Test Coverage

**Current state**: 5 structural/static tests. No runtime behavior tests. No integration tests that actually run a phase and validate output.

**Actions**:

1. **Add runtime smoke test.** `test/test-smoke.sh`: Create a temp project, run `/spec-drive:new`, verify idea.md and state file are correct. This tests the actual workflow, not just file existence.

2. **Add phase transition test.** `test/test-transitions.sh`: Create a project with pre-built artifacts, attempt each phase transition, verify checklists pass/fail correctly. Test both valid and invalid transitions.

3. **Add hook integration test.** `test/test-hook-integration.sh`: Simulate SessionStart and Stop with various project states (execution in progress, awaiting approval, completed, corrupt state). Verify hook output matches expected behavior.

4. **Add artifact quality test.** `test/test-artifact-quality.sh`: Generate sample artifacts using templates, verify they contain no template variables, have valid frontmatter, and pass cross-CLI portability checks. This is what test-cross-cli.sh tries to do but crashes before completing.

5. **Add macOS CI.** GitHub Actions workflow with macOS runner. If tests don't pass on macOS, the PR doesn't merge. Period.

**Measurable outcome**: Test suite covers structure (existing), runtime behavior (new), and cross-platform (fixed). Measure: test count and platform coverage. Target: 80+ checks across macOS and Linux.

---

## Dimension 8: Developer Experience (DX)

**Current state**: 9 commands, clean but minimal. No onboarding flow, no error recovery guidance, no progress visualization.

**Actions**:

1. **Add `/spec-drive:doctor` command.** Checks environment (bash version, jq installed, git available), validates plugin structure, tests hook execution, reports PROJECT_ROOT status. First thing a new user runs.

2. **Improve error messages.** Every error should include: what failed, why, and what to do next. Current errors are technically correct but don't guide the user. Example: instead of "research.md missing Executive Summary", say "research.md is missing the '## Executive Summary' section. This is required before generating requirements. Re-run /spec-drive:research to regenerate it, or add the section manually."

3. **Add `/spec-drive:timeline` command.** Shows the full artifact chain with timestamps, sha256 hashes, and phase durations. Helps the user understand where time was spent and whether artifacts are stale.

4. **Add progress visualization to status.** Show a progress bar or phase diagram in `/spec-drive:status` output. Humans process visual progress faster than text tables.

5. **Add `--dry-run` to implement.** Show which tasks would execute, in what order, with what verify commands — without actually running anything. Lets users preview the execution plan before committing tokens.

**Measurable outcome**: New users can install, validate, and run their first spec in <10 minutes. Measure: time from clone to first successful `/spec-drive:new` completion.

---

## Dimension 9: Safety & Recovery

**Current state**: Good defensive guardrails (path validation, iteration limits, ambiguity detection, unsafe verify rejection). No proactive recovery mechanisms.

**Actions**:

1. **Add state snapshots.** Before each task execution, snapshot `.spec-drive-state.json` to `.spec-drive-state.backup.json`. If the state file becomes corrupt mid-execution, the system can recover from the snapshot instead of requiring manual intervention.

2. **Add `/spec-drive:recover` command.** Detects and fixes common failure states:
   - Corrupt state file → restore from backup
   - Orphaned lock files → clean up with user confirmation
   - Stale progress files → archive and reset
   - Mismatched task count → recount from tasks.md

3. **Add execution audit log.** Append each state transition to `.spec-drive-audit.log` (one JSON line per event). This provides a full history of what happened during execution, invaluable for debugging failures and understanding token spend.

4. **Add graceful degradation.** If jq is not installed, fall back to basic grep/sed for JSON parsing instead of silently bailing. If git is not available, skip commit steps but continue execution. Document what's lost when optional tools are missing.

**Measurable outcome**: Zero unrecoverable states during execution. Measure: percentage of failures that can be recovered without manual state editing. Target: >95%.

---

## Dimension 10: Token Efficiency

**Current state**: No explicit token management. Fresh-context-per-task is good for window management but no measurement of actual token spend per phase or task.

**Actions**:

1. **Add phase cost tracking.** Record approximate token usage per phase in `.progress.md` (based on artifact size as proxy). This helps users understand where their budget goes.

2. **Add `--budget` flag to implement.** Set a maximum task count or retry count for a single session. When budget is reached, save state and stop gracefully instead of hitting the global iteration limit.

3. **Minimize context in hooks.** The stop-watcher outputs substantial continuation prompts. Measure their token cost and trim to the minimum needed for resumption. Every token in the hook output is a token not available for actual work.

4. **Add artifact caching.** If research.md hasn't changed since last requirements generation, skip re-reading it. Use sha256 hashes in state to detect staleness.

**Measurable outcome**: Measurable reduction in tokens-per-completed-spec. Target: 15-20% reduction through smarter context management.

---

## Implementation Priority

### Phase 1: Fix What's Broken (Week 1)
1. Fix macOS tests (`head -n -1` → `sed '$d'`)
2. Enrich plugin manifest
3. Add `/spec-drive:doctor` command
4. Add macOS CI workflow

### Phase 2: Close the Gap with Ralph (Weeks 2-3)
5. Add `/spec-drive:refactor` command
6. Add `/spec-drive:switch` and `/spec-drive:list`
7. Add interview mode to requirements phase
8. Add failure classification and fixTaskMap
9. Add runtime smoke tests

### Phase 3: Surpass Ralph (Weeks 4-6)
10. Add `/spec-drive:triage` with epic.json
11. Add design-aware verification
12. Add progressive context escalation
13. Add circuit breaker pattern
14. Ship Codex adapter
15. Add execution audit log

### Phase 4: Dominate (Weeks 7-10)
16. Ship CODA adapter
17. Add cross-spec search
18. Add `/spec-drive:timeline` and `--dry-run`
19. Add state snapshots and `/spec-drive:recover`
20. Add token budget tracking
21. Add adapter validation tests

---

## Success Criteria

Spec-Drive beats Ralph Specum on every measurable dimension when:

| Dimension | Target | How to Measure |
|-----------|--------|---------------|
| Post-execution iteration | Refactor in <30% of original spec time | Time from "refactor start" to "updated tasks ready" |
| Epic handling | >80% completion rate for L/XL features | Track completion across triaged epic specs |
| Multi-spec management | Zero cross-project incidents | Error logs during multi-spec sessions |
| Requirement quality | >70% first-review approval rate | Percentage of requirements accepted without changes |
| Execution reliability | <1.5 retries per task | Average retry count across projects |
| Cross-CLI portability | Install + run on 3 CLIs | Adapter test pass rate per platform |
| Test coverage | 80+ checks, macOS + Linux | CI pass rate |
| Time to first spec | <10 minutes from clone | Timed onboarding sessions |
| Recovery rate | >95% auto-recoverable failures | Failures requiring manual state editing |
| Token efficiency | 15-20% reduction | Tokens per completed spec (proxy: artifact sizes) |

When all ten targets are met, Spec-Drive is not incrementally better — it's categorically better. The combination of Ralph's operational depth with Spec-Drive's architectural rigor, cross-CLI portability, and strict validation creates a product that no current spec workflow can match.
