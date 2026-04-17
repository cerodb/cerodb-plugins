#!/usr/bin/env bash
# test-skills-structure.sh
# Validates that every skills/* subdirectory has a SKILL.md with required frontmatter
# and a .clawhub/meta.json publish manifest.
# Exit 0 = all checks pass. Exit 1 = at least one check failed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
PASS=0
FAIL=0

pass() { echo "  PASS: $*"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $*"; FAIL=$((FAIL + 1)); }

echo "=== skills/ structure validation ==="
echo "Root: $SKILLS_DIR"
echo ""

# Check skills/ directory exists
if [ ! -d "$SKILLS_DIR" ]; then
  echo "FATAL: $SKILLS_DIR does not exist"
  exit 1
fi

# Find all skill subdirectories (immediate children only)
skill_dirs=()
while IFS= read -r d; do
  skill_dirs+=("$d")
done < <(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [ "${#skill_dirs[@]}" -eq 0 ]; then
  echo "INFO: No skill subdirectories found in skills/ — nothing to validate."
  echo ""
  echo "Result: PASS (0 skills, 0 failures)"
  exit 0
fi

for skill_dir in "${skill_dirs[@]}"; do
  slug="$(basename "$skill_dir")"
  echo "--- skills/$slug ---"

  # AC4: SKILL.md exists
  skill_md="$skill_dir/SKILL.md"
  if [ ! -f "$skill_md" ]; then
    fail "$slug: SKILL.md not found"
    continue
  fi
  pass "$slug: SKILL.md exists"

  # AC5: SKILL.md contains 'name:' frontmatter
  if grep -q "^name:" "$skill_md"; then
    pass "$slug: SKILL.md has 'name:' frontmatter"
  else
    fail "$slug: SKILL.md missing 'name:' frontmatter"
  fi

  # AC5: SKILL.md contains 'description:' frontmatter
  if grep -q "^description:" "$skill_md"; then
    pass "$slug: SKILL.md has 'description:' frontmatter"
  else
    fail "$slug: SKILL.md missing 'description:' frontmatter"
  fi

  # AC6 (US6): .clawhub/meta.json publish manifest exists
  clawhub_meta="$skill_dir/.clawhub/meta.json"
  if [ ! -f "$clawhub_meta" ]; then
    fail "$slug: .clawhub/meta.json not found"
  else
    pass "$slug: .clawhub/meta.json exists"
    # Validate meta.json is valid JSON with required fields
    if node -e "
      const m = JSON.parse(require('fs').readFileSync('$clawhub_meta', 'utf8'));
      if (!m.slug) throw new Error('missing slug');
      if (!m.version) throw new Error('missing version');
      if (!Array.isArray(m.tags) || m.tags.length === 0) throw new Error('missing tags array');
      if (!m.tags.includes('latest')) throw new Error('tags must include latest');
    " 2>/dev/null; then
      pass "$slug: .clawhub/meta.json is valid (slug, version, tags present)"
    else
      fail "$slug: .clawhub/meta.json invalid JSON or missing required fields (slug, version, tags)"
    fi
  fi
done

echo ""
echo "=== Summary: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
