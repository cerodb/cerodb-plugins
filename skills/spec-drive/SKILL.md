---
name: spec-drive
description: "Spec-driven development workflow: take any idea through research → requirements → design → tasks → autonomous implementation using structured Markdown artifacts"
metadata: {"openclaw":{"requires":{"bins":["node"]},"emoji":"📋"}}
---

# Spec-Drive

Spec-Drive runs a coding idea through a structured chain of phases — each producing plain Markdown artifacts — so any runtime can continue the workflow without hidden session context. Wrapper skill — delegates to the locally-installed spec-drive plugin.

## Workflow Phases

```
idea → research → requirements → design → tasks → execution
```

| Phase | Artifact | Description |
|-------|----------|-------------|
| **idea** | `idea.md` | Goal statement and project name; created by `/spec-drive:new` |
| **research** | `research.md` | Feasibility analysis, existing patterns, codebase exploration |
| **requirements** | `requirements.md` | Structured user stories with acceptance criteria |
| **design** | `design.md` | Technical architecture, component breakdown, trade-offs |
| **tasks** | `tasks.md` | Phased implementation plan with quality checkpoints |
| **execution** | git commits | Autonomous per-task implementation with verification |

## Requirements

- Spec-Drive plugin installed locally (see `INSTALL.md`)
- `node` v22+ on PATH (for `npm test` validation)
- `bash`, `git`, `jq`, and standard Unix tools on PATH
- `SPEC_DRIVE_DIR` env var set, or plugin at the default path `$HOME/claw-projects/cerodb-plugins/plugins/spec-drive`

## Commands

### new

Create a new spec-drive project. Scaffolds the project directory and kicks off the research phase.

**Usage:**

```bash
/spec-drive:new "my-feature-name" "Build an auth service with JWT support"
```

With auto mode (skips confirmations):

```bash
/spec-drive:new "my-feature-name" --auto
```

---

### research

Run or re-run the research phase for the active project. Explores the codebase, runs web searches, and writes `research.md`.

**Usage:**

```bash
/spec-drive:research
```

---

### requirements

Generate structured requirements from research findings. Delegates to the product-manager agent and writes `requirements.md`.

**Usage:**

```bash
/spec-drive:requirements
```

---

### design

Generate a technical design document from validated requirements. Delegates to the architect agent and writes `design.md`.

**Usage:**

```bash
/spec-drive:design
```

---

### tasks

Generate a phased implementation task plan from the technical design. Delegates to the task-planner agent and writes `tasks.md`.

**Usage:**

```bash
/spec-drive:tasks
```

---

### implement

Start the autonomous task execution loop. Orchestrates implementation by delegating each task to the appropriate executor or QA agent. Never implements directly — coordinates subagents.

**Usage:**

```bash
/spec-drive:implement
```

Resume after interruption:

```bash
/spec-drive:implement --resume
```

---

### status

Show the current state and progress of the active spec-drive project.

**Usage:**

```bash
/spec-drive:status
```

Sample output:

```
Project: my-feature-name
Phase:   tasks (complete)
Next:    implement
Tasks:   3/7 complete
```

---

### cancel

Cancel the active execution and clean up state. Use `--delete` to also remove the project directory.

**Usage:**

```bash
/spec-drive:cancel
```

With project deletion:

```bash
/spec-drive:cancel --delete
```

---

### help

Show all spec-drive commands and workflow overview.

**Usage:**

```bash
/spec-drive:help
```

---

## Full Workflow Example

```bash
# 1. Start a new project
/spec-drive:new "delivery-kpi-dashboard" "Build a KPI tracking dashboard for AI project delivery metrics"

# 2. Review and iterate on research
/spec-drive:research          # re-run if needed

# 3. Generate requirements
/spec-drive:requirements

# 4. Generate technical design
/spec-drive:design

# 5. Generate implementation tasks
/spec-drive:tasks

# 6. Execute autonomously
/spec-drive:implement

# Check progress at any time
/spec-drive:status
```

## Trigger Conditions

Invoke `spec-drive` when the user wants to:

- Start a new feature, refactor, or larger coding initiative from scratch
- Plan and structure work before writing any code ("plan this feature", "write a spec for", "break this down")
- Run spec-driven development, TDD at the planning level, or structured AI-assisted coding
- Resume an in-progress spec workflow that was interrupted
- Check the status of an ongoing spec project
- Cancel or reset a spec in progress

## Artifacts and Portability

All artifacts are plain Markdown files stored in the project directory (default: `~/spec-drive-projects/<name>/`). They are runtime-agnostic: another model or CLI can pick up where the previous one left off by reading the Markdown files and checking `.spec-drive-state.json`.
