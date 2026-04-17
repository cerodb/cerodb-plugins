# P322 — ClawHub Skills Publish Checklist

**Project:** P322 — OpenClaw ClawHub Skills Packaging
**Date:** 2026-04-12
**Status:** Ready to publish

---

## Pre-publish checklist

Before running any publish command, confirm:

- [ ] `clawhub` CLI is installed and up to date: `clawhub --version`
- [ ] You are logged in: `clawhub whoami`
- [ ] Both structure tests pass: `bash test/test-skills-structure.sh`
- [ ] Both e2e tests pass: `bash test/test-skills-e2e.sh`
- [ ] Dry-run simulation clean: `node scripts/dry-run-local.mjs`
- [ ] `skills/think-tank/.clawhub/meta.json` has correct version
- [ ] `skills/spec-drive/.clawhub/meta.json` has correct version

---

## Login

```bash
clawhub login
# or with a token:
clawhub login --token <your-token>
```

---

## Publish commands

### think-tank skill

```bash
clawhub publish skills/think-tank \
  --slug think-tank \
  --name "Think Tank" \
  --version 1.0.0
```

Expected output:
```
Published think-tank@1.0.0
```

### spec-drive skill

```bash
clawhub publish skills/spec-drive \
  --slug spec-drive \
  --name "Spec Drive" \
  --version 1.0.0
```

Expected output:
```
Published spec-drive@1.0.0
```

---

## Sync all skills (after initial publish)

For subsequent updates, use sync to push changed skills:

```bash
# Dry-run first — see what would change
clawhub sync --dry-run --root skills/

# Publish all changed skills
clawhub sync --root skills/
```

---

## Post-publish verification

After publishing, confirm each skill is live:

```bash
# Search registry to confirm skills are discoverable
clawhub search think-tank
clawhub search spec-drive

# Install each skill into a test workspace
mkdir -p /tmp/clawhub-verify && cd /tmp/clawhub-verify
clawhub install think-tank
clawhub install spec-drive

# Confirm SKILL.md present in installed locations
ls skills/think-tank/SKILL.md
ls skills/spec-drive/SKILL.md

# Cleanup
cd ~ && rm -rf /tmp/clawhub-verify
```

---

## Version bump procedure

When releasing a new version of a skill:

1. Edit `skills/<slug>/.clawhub/meta.json` — bump `version` field
2. Edit `skills/<slug>/SKILL.md` — update content as needed
3. Run tests: `bash test/test-skills-structure.sh && bash test/test-skills-e2e.sh`
4. Publish: `clawhub publish skills/<slug> --slug <slug> --version <new-version>`
5. Commit: `git commit -m "chore: bump <slug> skill to v<new-version>"`

---

## Auth notes

- `clawhub sync --dry-run` in v0.9.0 requires an active auth session (calls `/whoami` before scanning).
- Auth token is stored at `~/.config/clawhub/config.json` (respects `$XDG_CONFIG_HOME`).
- For CI/CD environments, use `clawhub login --token $CLAWHUB_TOKEN` with a secret token.
- For local simulation without auth (structure validation only): `node scripts/dry-run-local.mjs`

---

## References

- Strategy: `spec/p322-adr-001-wrapper-vs-native.md`
- Contract: `spec/p322-clawhub-contract.md`
- Sync dry-run output: `spec/p322-sync-dryrun-output.md`
- Skills documentation: `skills/README.md`
