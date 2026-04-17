---
spec: p283-spec-drive
created: 2026-03-29T15:35:00-03:00
status: pre-release-hold
---

# Release Readiness Log — 2026-03-29

## Purpose

This log records what was completed, what was reviewed, what risks were identified, what was hardened, and why release tagging is currently deferred.

## Executive State

- `P283` progressed through Phase 5 and Phase 6.1.
- Debate/stress-testing for all 6 agents is complete.
- Local validation is green.
- The repo topology was normalized to `main`.
- A safety hardening pass was completed before any release/tag step.
- Tagging is intentionally deferred pending an additional Claude review.

## Completed Work

### Phase 5 Closure

Completed:
- `5.1` researcher
- `5.2` product-manager
- `5.3` architect
- `5.4` 3-transcript checkpoint
- `5.5` task-planner
- `5.6` executor
- `5.7` qa-engineer
- `5.8` final debate validation

Evidence:
- debate transcripts exist under `~/claw-projects/spec-drive/agents/adversarial/`
- transcript count exceeded the minimum threshold

Phase 5 closure commits:
- `c1c5598` `feat(agents): complete phase 5 prompt hardening`
- `788bfe2` `docs(debate): add final phase 5 transcripts`

### Agent Hardening Summary

`architect.md`
- mechanical input validation
- blocked/incomplete frontmatter states
- mandatory `requirements_sha`
- unresolved-gap handling
- canonical progress semantics

`task-planner.md`
- explicit `Traces`
- explicit `Cwd` and `Timeout`
- concrete `repoRoot` derivation
- stronger Phase 1 verify patterns
- resume/handoff state contract

`executor.md`
- dirty-file preflight guard
- tighter QA handoff semantics
- clearer retry and fast-fail behavior
- portable locking
- unexpected-file blocking
- corrected commit/progress ordering

`qa-engineer.md`
- explicit timeout contract
- `[MECHANICAL]` vs `[INSPECTED]` AC reporting
- test-file discovery order
- stricter signal discipline
- canonical `.progress.md` structure

### Validation

Confirmed green:
- `npm run test:structure`
- `npm run test:hooks`
- `npm run test:commands`
- `npm run test:schema`
- `npm run test:cross-cli`

### Phase 6.1

`6.1` was completed using the task's grouped programmatic verification contract:
- local suite passed again
- debate transcript threshold remained satisfied
- no new local regressions surfaced

## Repo State Changes

Initial issue:
- active work had been accumulating on `feat/phase2-refactoring`
- that branch name no longer matched the actual state of the project

Actions taken:
- created/pushed private repo `cerodb/spec-drive`
- normalized default branch to `main`
- fast-forwarded `main` to the latest integrated state
- deleted `feat/phase2-refactoring` locally and remotely

Current repo state:
- active branch: `main`
- tracking: `origin/main`
- GitHub default branch: `main`

## Risks Considered

### Considered and Cleared

- secret leakage
  - no API keys or obvious credentials found in the repo scan

- branch topology drift
  - resolved by collapsing release state onto `main` and deleting the stale feature branch

- incomplete Phase 5 evidence
  - resolved enough to close the phase honestly with normalized transcripts and explicit commits

### Considered and Fixed

#### 1. Destructive delete path in `cancel --delete`

Problem:
- deletion was based on derived path with insufficient root validation
- risk: deleting outside the intended Spec-Drive sandbox

Fix:
- added approved-root path validation
- refuse empty/root/home/out-of-root paths
- prefer `trash` when available

#### 2. Ambiguous project auto-selection in `stop-watcher`

Problem:
- the hook could choose the first matching active project
- risk: resume or cleanup against the wrong spec in multi-project situations

Fix:
- require safe path under approved root
- detect multiple active matches
- refuse auto-resume/cleanup on ambiguity

Safety hardening commit:
- `055bab9` `fix(safety): harden project selection and deletion guards`

## Why Release Is On Hold

Release is intentionally paused here because:
- the safety hardening was only just added
- Gabriel wants an additional Claude review before any tag/release step

That means:
- do not run `6.2` yet
- do not tag `v1.0.0` yet

## Remaining Planned Step

### Deferred

`6.2 Push final state and tag release`

This remains intentionally deferred until after the additional Claude review.

## Suggested Next Review Ask

Recommended framing for the next Claude review:

- review `spec-drive` as a near-release cross-CLI plugin
- focus on safety, destructive actions, project selection, execution semantics, and release readiness
- explicitly ask whether anything still blocks tagging after the safety hardening commit `055bab9`

## Bottom Line

`spec-drive` is now:
- structurally solid
- debate-tested
- locally validated
- branch-clean
- meaningfully safer than before

It is not yet tagged because the process is intentionally waiting on one more external review pass.

## Addendum — Late Security Hardening

After the original readiness pass, a new Claude review surfaced a mixed report containing both stale and current issues. The repo was re-audited against actual source and these remaining live issues were fixed:

- `schemas/spec-drive.schema.json` now accepts `phase: "completed"` so the schema matches `/spec-drive:implement` archival behavior.
- `agents/researcher.md` no longer trusts `codebasePath` or `codebase_root` blindly; candidate codebase paths must resolve to the project root or a descendant of it.
- `agents/task-planner.md` and `agents/executor.md` now explicitly reject destructive or privilege-escalating `Verify` commands instead of treating arbitrary shell as acceptable verification.
- `hooks/scripts/stop-watcher.sh` now normalizes non-numeric iteration values before enforcing the global safety cap.

Verification after this addendum:
- `test:structure` passed
- `test:hooks` passed
- `test:commands` passed
- `test:schema` passed

Release policy did not change:
- do not tag yet
- keep the latest hardening commits private until Gabriel asks for the next release move
