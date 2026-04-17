# ClawHub Skills

This directory is the ClawHub distribution channel for cerodb skills.

## Two distribution channels

This repo uses two separate channels for distributing skills:

| Channel | Directory | Install mechanism | Audience |
|---------|-----------|-------------------|----------|
| **Claude Code plugin** | `plugins/<name>/` | `claude mcp add` or marketplace | Claude Code users |
| **ClawHub skill registry** | `skills/<slug>/` | `clawhub install <slug>` | OpenClaw users |

The `plugins/` channel ships complete Claude Code plugin packages (agent prompts, commands, hooks, schemas). The `skills/` channel ships lean `SKILL.md` invocation stubs that OpenClaw loads at runtime.

## Skill structure

Each skill lives in its own subdirectory:

```text
skills/
  <slug>/
    SKILL.md        # required — frontmatter + invocation body
    INSTALL.md      # optional — env var requirements, prereqs
```

### SKILL.md minimum frontmatter

```markdown
---
name: skill-slug
description: "One-line summary shown in clawhub search results"
---

<invocation body — shell script, prompt text, or delegating wrapper>
```

Only `name` and `description` are required. All other frontmatter fields are optional.

## Wrapper vs native strategy (ADR-001)

Skills in this repo follow two packaging patterns decided in `spec/p322-adr-001-wrapper-vs-native.md`:

- **Wrapper skills** — thin stubs that delegate to an installed plugin binary/script. Used for orchestration-heavy skills (think-tank modes, spec-drive commands). The logic lives in the plugin; the skill is a discovery and invocation shim.
- **Native skills** — self-contained `SKILL.md` files where the entire skill IS the prompt or instruction text. Used for agent instruction skills (e.g. `communication-style`, `delegation-principle`).

## Publishing to ClawHub

```bash
# Publish a single skill
clawhub publish skills/<slug> --slug <slug> --name "Display Name" --version 1.0.0

# Dry-run sync all skills
clawhub sync --dry-run --root skills/

# Install a skill (user side)
clawhub install <slug>
```

## Current skills

| Slug | Type | Status |
|------|------|--------|
| _(none yet)_ | — | — |

Skills are scaffolded here as they are built in subsequent stories of P322.
