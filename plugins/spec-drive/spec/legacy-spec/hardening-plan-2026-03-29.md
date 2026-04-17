---
spec: p283-spec-drive
created: 2026-03-29T15:55:00-03:00
status: executing
---

# Hardening Plan — Post-Review Fixes

Based on two independent adversarial reviews (cold review + final readiness review).
Consolidated findings, deduplicated, ordered by severity.

## Blockers (must fix before v1.0.0)

### FIX-1: Hardcoded `/tmp/sd-state.json` in `commands/research.md`
- **Severity**: HIGH
- **File**: `commands/research.md` (lines ~80, ~88)
- **Problem**: Race condition — two concurrent research invocations clobber each other's temp file. Agent was fixed but command was not.
- **Fix**: Replace both `/tmp/sd-state.json` with `$(mktemp)` pattern.

### FIX-2: `git commit --amend` in `agents/executor.md`
- **Severity**: HIGH
- **File**: `agents/executor.md` (lines ~119-122, ~147)
- **Problem**: If session killed between commit and amend, amend targets wrong commit. Parallel execution makes this worse.
- **Fix**: Replace amend with separate tracking commit: `chore(spec-drive): update progress for task X.Y`.

### FIX-3: `context-loader.sh` missing safety guards
- **Severity**: HIGH
- **File**: `hooks/scripts/context-loader.sh` (lines ~46-56)
- **Problem**: No `is_safe_spec_path`, no ambiguity detection, no `readlink -f`. stop-watcher has all three.
- **Fix**: Port `is_safe_spec_path()`, `PROJECT_ROOT_REAL`, and multi-match detection from stop-watcher.

### FIX-4: `cancel.md` deletes state from wrong path
- **Severity**: MEDIUM (blocker because cancel is broken)
- **File**: `commands/cancel.md` (line ~48)
- **Problem**: Deletes `{projectDir}/.spec-drive-state.json` but file lives at `{basePath}/.spec-drive-state.json`. Cancel silently does nothing.
- **Fix**: Change to `{basePath}/.spec-drive-state.json`. Also add `readlink -f` before rm -rf validation.

### FIX-5: Project name not sanitized in `commands/new.md`
- **Severity**: MEDIUM (blocker — path traversal)
- **File**: `commands/new.md` (lines ~12-13, ~43)
- **Problem**: `../../etc/evil` as project name creates dirs outside project root.
- **Fix**: Validate name against `^[a-zA-Z0-9_.-]+$`. Reject `/`, `..`, whitespace.

### FIX-6: `help.md` says --auto has approval gates (opposite of reality)
- **Severity**: LOW (blocker — misleading core feature)
- **File**: `commands/help.md` (line ~58)
- **Fix**: Change to "bypassing approval gates between phases".

## Should Fix (not blockers but real risks)

### FIX-7: Parallel lock has no timeout
- **File**: `agents/executor.md` (lines ~139-148)
- **Problem**: Stale lock from killed process = permanent deadlock.
- **Fix**: Add 60-second timeout + stale lock detection (mtime check).

### FIX-8: `totalTasks` never recounted on resume
- **File**: `commands/implement.md` (lines ~88-100)
- **Problem**: Manual edits to tasks.md between sessions = stale count.
- **Fix**: Recount on resume, warn if count changed.

### FIX-9: `ALL_TASKS_COMPLETE` grep without line anchor
- **File**: `hooks/scripts/stop-watcher.sh` (lines ~159-163)
- **Problem**: False positive if string appears in conversation.
- **Fix**: Anchor: `grep -q "^ALL_TASKS_COMPLETE$"`.

### FIX-10: `implement.md` cleanup references wrong lock files
- **File**: `commands/implement.md` (line ~257)
- **Problem**: Cleans `.tasks.lock` and `.git-commit.lock` (don't exist). Doesn't clean `.execution-state.lock` (does exist).
- **Fix**: Replace with `rmdir {basePath}/.execution-state.lock 2>/dev/null || true`.

### FIX-11: State file deleted on completion (no archive)
- **File**: `commands/implement.md` (line ~255)
- **Fix**: Set `phase: "completed"` instead of deleting.

### FIX-12: Debate transcripts tracked in release
- **Files**: `.gitignore`, `agents/adversarial/`, `debate-transcripts/`
- **Fix**: Add to `.gitignore`, `git rm --cached -r` both dirs.

### FIX-13: `totalTasks=0` enters execution phase (limbo state)
- **File**: `commands/implement.md`
- **Fix**: Reject with error if totalTasks is 0 after counting.

## Execution Order

1. FIX-1 (research.md mktemp) — 2 min
2. FIX-5 (new.md name sanitization) — 5 min
3. FIX-4 (cancel.md path + symlink) — 5 min
4. FIX-2 (executor.md amend → separate commit) — 5 min
5. FIX-3 (context-loader.sh safety port) — 10 min
6. FIX-6 (help.md text) — 1 min
7. FIX-7 (lock timeout) — 5 min
8. FIX-8 (totalTasks recount) — 5 min
9. FIX-9 (grep anchor) — 1 min
10. FIX-10 (implement cleanup) — 2 min
11. FIX-11 (state archive) — 2 min
12. FIX-12 (gitignore transcripts) — 2 min
13. FIX-13 (zero tasks guard) — 2 min
14. Run full test suite
15. Single commit: `fix(safety): address all release readiness findings`

Total estimated: ~45 min
