#!/usr/bin/env bash
# test-skills-e2e.sh
#
# End-to-end skill validation test.
# Installs both skills from local paths into a temp workspace (using the local
# install simulator) and verifies that .clawhub/lock.json is created and that
# skills are discoverable under the workspace.
#
# Requirements: node v22+ on PATH
# Runs non-interactively; no registry auth needed.
#
# Exit codes:
#   0  All checks passed
#   1  One or more checks failed

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$REPO_ROOT/scripts"
SKILLS_DIR="$REPO_ROOT/skills"

PASS=0
FAIL=0

pass() { echo "  PASS: $*"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $*"; FAIL=$((FAIL + 1)); }

# ── AC2: Create temp workspace and register cleanup ──────────────────────────

TMPWORK="$(mktemp -d)"
cleanup() {
  rm -rf "$TMPWORK"
}
trap cleanup EXIT

echo "=== ClawHub skills e2e test ==="
echo "Repo root: $REPO_ROOT"
echo "Temp workspace: $TMPWORK"
echo ""

# ── AC3: Install think-tank from local path and verify lock.json ─────────────

echo "--- Installing think-tank ---"
INSTALL_OUTPUT="$(node "$SCRIPTS_DIR/local-install.mjs" "$SKILLS_DIR/think-tank" "$TMPWORK" 2>&1)"
INSTALL_EXIT=$?

if [ "$INSTALL_EXIT" -eq 0 ]; then
  pass "think-tank: local-install exited 0"
  echo "  Output: $INSTALL_OUTPUT"
else
  fail "think-tank: local-install failed (exit $INSTALL_EXIT): $INSTALL_OUTPUT"
fi

LOCKFILE="$TMPWORK/.clawhub/lock.json"

if [ -f "$LOCKFILE" ]; then
  pass "think-tank: .clawhub/lock.json created"
else
  fail "think-tank: .clawhub/lock.json NOT found at $LOCKFILE"
fi

if node -e "
  const fs = require('fs');
  const lock = JSON.parse(fs.readFileSync('$LOCKFILE', 'utf8'));
  if (lock.version !== 1) throw new Error('lock version must be 1, got ' + lock.version);
  if (!lock.skills || !lock.skills['think-tank']) throw new Error('think-tank not in lock.skills');
  const entry = lock.skills['think-tank'];
  if (!entry.version) throw new Error('think-tank entry missing version');
  if (typeof entry.installedAt !== 'number') throw new Error('think-tank entry missing installedAt');
" 2>&1; then
  pass "think-tank: lock.json has valid think-tank entry (version + installedAt)"
else
  fail "think-tank: lock.json invalid or missing think-tank entry"
fi

if [ -f "$TMPWORK/skills/think-tank/SKILL.md" ]; then
  pass "think-tank: SKILL.md discoverable in workspace skills/"
else
  fail "think-tank: SKILL.md not found at $TMPWORK/skills/think-tank/SKILL.md"
fi

echo ""

# ── AC4: Install spec-drive from local path and verify lock.json ─────────────

echo "--- Installing spec-drive ---"
INSTALL_OUTPUT="$(node "$SCRIPTS_DIR/local-install.mjs" "$SKILLS_DIR/spec-drive" "$TMPWORK" 2>&1)"
INSTALL_EXIT=$?

if [ "$INSTALL_EXIT" -eq 0 ]; then
  pass "spec-drive: local-install exited 0"
  echo "  Output: $INSTALL_OUTPUT"
else
  fail "spec-drive: local-install failed (exit $INSTALL_EXIT): $INSTALL_OUTPUT"
fi

if [ -f "$LOCKFILE" ]; then
  pass "spec-drive: .clawhub/lock.json still present"
else
  fail "spec-drive: .clawhub/lock.json missing"
fi

if node -e "
  const fs = require('fs');
  const lock = JSON.parse(fs.readFileSync('$LOCKFILE', 'utf8'));
  if (lock.version !== 1) throw new Error('lock version must be 1');
  if (!lock.skills || !lock.skills['think-tank']) throw new Error('think-tank missing from lock');
  if (!lock.skills || !lock.skills['spec-drive']) throw new Error('spec-drive not in lock.skills');
  const entry = lock.skills['spec-drive'];
  if (!entry.version) throw new Error('spec-drive entry missing version');
  if (typeof entry.installedAt !== 'number') throw new Error('spec-drive entry missing installedAt');
" 2>&1; then
  pass "spec-drive: lock.json has valid entries for both think-tank and spec-drive"
else
  fail "spec-drive: lock.json invalid or missing expected skill entries"
fi

if [ -f "$TMPWORK/skills/spec-drive/SKILL.md" ]; then
  pass "spec-drive: SKILL.md discoverable in workspace skills/"
else
  fail "spec-drive: SKILL.md not found at $TMPWORK/skills/spec-drive/SKILL.md"
fi

echo ""

# ── Summary ──────────────────────────────────────────────────────────────────

echo "=== Summary: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
