---
spec: p283-spec-drive
phase: requirements
created: 2026-03-28T19:00:00Z
---

# Requirements: Spec-Drive — Claude Code Plugin for Spec-Driven Development

## Goal

Build "Spec-Drive" — a Claude Code plugin that drives spec-driven development through a document chain (idea.md -> research.md -> requirements.md -> design.md -> tasks.md), with role-based agents, quality gates between phases, and fresh-context task execution. Original code inspired by ralph-specum's architecture. Cross-CLI by design (plain Markdown artifacts consumable by Codex, Gemini, Kiro without export).

---

## User Stories

### Feature Area 1: Document Chain & Project Structure

#### US-1: Idea-First Initialization
**As a** developer
**I want to** start a spec from an idea.md file that contains my project vision
**So that** every subsequent phase has a clear origin point to build from

**Acceptance Criteria:**
- [ ] AC-1.1: `/spec-drive:new <name> [goal]` creates `<name>/spec/` directory with idea.md (if name starts with P### uses it as-is, otherwise uses name verbatim)
- [ ] AC-1.2: idea.md contains the user-provided goal text verbatim, plus a structured "Vision" and "Constraints" section
- [ ] AC-1.3: If no goal text provided, the command prompts the user for one before proceeding
- [ ] AC-1.4: idea.md is the sole input to the research phase — no other context files are needed
- [ ] AC-1.5: Directory structure is always project-first: `<name>/spec/` (no alternative path layout). Default project root: `~/spec-drive-projects/`

#### US-2: Document Chain Flow
**As a** developer
**I want to** each spec phase to read the previous phase's document as its primary input
**So that** context flows through the chain without metadata coupling or frontmatter dependencies

**Acceptance Criteria:**
- [ ] AC-2.1: Research agent reads idea.md as input, produces research.md
- [ ] AC-2.2: PM agent reads idea.md + research.md as input, produces requirements.md
- [ ] AC-2.3: Architect agent reads idea.md + research.md + requirements.md, produces design.md
- [ ] AC-2.4: Task planner reads requirements.md + design.md, produces tasks.md
- [ ] AC-2.5: Each document is self-contained — a reader with ONLY that document and its predecessors has full context
- [ ] AC-2.6: No template variables (e.g., `{{research_summary}}`) are used between phases — agents read full files directly

#### US-3: Progress Tracking via .progress.md
**As a** developer
**I want to** a shared .progress.md that accumulates learnings across all phases
**So that** later phases and retries benefit from discoveries made earlier

**Acceptance Criteria:**
- [ ] AC-3.1: .progress.md is created at spec initialization with the original goal
- [ ] AC-3.2: Every phase appends its key learnings to the Learnings section
- [ ] AC-3.3: During execution, each task receives .progress.md as context (along with its task definition)
- [ ] AC-3.4: .progress.md follows a consistent format: Original Goal, Completed Tasks, Current Task, Learnings, Blockers, Next

---

### Feature Area 2: Role-Based Agents

#### US-4: Researcher Agent
**As a** developer
**I want to** a researcher agent that explores feasibility, prior art, and codebase patterns
**So that** the spec is grounded in reality before requirements are written

**Acceptance Criteria:**
- [ ] AC-4.1: Agent prompt is original (not copied from ralph-specum's research-analyst.md)
- [ ] AC-4.2: Agent performs web search for best practices and prior art
- [ ] AC-4.3: Agent explores codebase for existing patterns relevant to the goal
- [ ] AC-4.4: Agent assesses technical feasibility with effort estimates
- [ ] AC-4.5: Agent outputs research.md with: Executive Summary, External Research, Codebase Analysis, Feasibility Assessment, Open Questions
- [ ] AC-4.6: Agent's prompt has been stress-tested via think-tank:debate before finalization

#### US-5: Product Manager Agent
**As a** developer
**I want to** a PM agent that translates the goal into structured user stories with testable acceptance criteria
**So that** requirements are unambiguous and verifiable

**Acceptance Criteria:**
- [ ] AC-5.1: Agent prompt is original
- [ ] AC-5.2: Agent produces user stories in "As a / I want to / So that" format
- [ ] AC-5.3: Every user story has testable acceptance criteria (AC-X.Y format)
- [ ] AC-5.4: Agent produces FR/NFR tables with priority and verification method
- [ ] AC-5.5: Agent identifies out-of-scope items, dependencies, and success criteria
- [ ] AC-5.6: Agent's prompt has been stress-tested via think-tank:debate before finalization

#### US-6: Architect Agent
**As a** developer
**I want to** an architect agent that designs the technical solution based on requirements
**So that** the implementation has a clear structure before coding begins

**Acceptance Criteria:**
- [ ] AC-6.1: Agent prompt is original
- [ ] AC-6.2: Agent produces design.md with: Architecture Overview, Component Breakdown, Data Flow, API/Interface Definitions, Technical Decisions (with rationale)
- [ ] AC-6.3: Agent references specific acceptance criteria from requirements.md to justify design choices
- [ ] AC-6.4: Agent identifies technical risks and mitigation strategies
- [ ] AC-6.5: Agent's prompt has been stress-tested via think-tank:debate before finalization

#### US-7: Task Planner Agent
**As a** developer
**I want to** a task planner that breaks down the design into actionable, POC-first tasks
**So that** implementation proceeds in phases: Make It Work -> Refactor -> Test -> Quality

**Acceptance Criteria:**
- [ ] AC-7.1: Agent prompt is original
- [ ] AC-7.2: Tasks follow POC-first decomposition: Phase 1 (POC), Phase 2 (Refactor), Phase 3 (Test), Phase 4 (Quality), Phase 5 (PR Lifecycle)
- [ ] AC-7.3: Each task has: Do (steps), Files (affected), Done when (criteria), Verify (command), Commit (message)
- [ ] AC-7.4: Tasks marked [P] can run in parallel; sequential tasks are unmarked
- [ ] AC-7.5: [VERIFY] checkpoint tasks are placed at phase boundaries
- [ ] AC-7.6: Agent's prompt has been stress-tested via think-tank:debate before finalization

#### US-8: Executor Agent
**As a** developer
**I want to** an executor agent that autonomously implements one task at a time
**So that** tasks are completed without human intervention during execution

**Acceptance Criteria:**
- [ ] AC-8.1: Agent prompt is original
- [ ] AC-8.2: Executor receives ONLY: current task definition + .progress.md (fresh context per task)
- [ ] AC-8.3: Executor never asks the user questions (fully autonomous)
- [ ] AC-8.4: Executor runs the Verify command and only signals TASK_COMPLETE when verification passes
- [ ] AC-8.5: Executor commits changes with the exact message from the task's Commit line
- [ ] AC-8.6: Executor updates .progress.md with completion status and learnings
- [ ] AC-8.7: Executor delegates [VERIFY] tasks to the QA agent instead of executing them directly

#### US-9: QA Agent
**As a** developer
**I want to** a QA agent that independently verifies acceptance criteria and quality gates
**So that** implementation quality is checked by a separate role

**Acceptance Criteria:**
- [ ] AC-9.1: Agent prompt is original
- [ ] AC-9.2: QA agent runs verification commands and outputs VERIFICATION_PASS or VERIFICATION_FAIL
- [ ] AC-9.3: QA agent can verify acceptance criteria from requirements.md against actual implementation
- [ ] AC-9.4: On VERIFICATION_FAIL, agent provides specific failure details for retry context
- [ ] AC-9.5: QA agent detects mock-only test anti-patterns (high mock ratio, missing real imports)

---

### Feature Area 3: Phase Transitions & Quality Gates

#### US-10: Phase Transition Checklists
**As a** developer
**I want to** explicit quality gates between phases that must pass before proceeding
**So that** each phase builds on verified-quality output from the previous phase

**Acceptance Criteria:**
- [ ] AC-10.1: Each phase transition (research->requirements, requirements->design, design->tasks, tasks->execution) has a defined checklist
- [ ] AC-10.2: Transition is blocked if checklist items are not satisfied
- [ ] AC-10.3: Phase commands (e.g., `/spec-drive:requirements`) verify the previous phase's checklist before proceeding
- [ ] AC-10.4: Checklists are defined in a skill file (not hardcoded in commands), allowing customization

**Phase Checklist Definitions:**
- Research -> Requirements: research.md exists, has Executive Summary, has Feasibility Assessment, has Open Questions
- Requirements -> Design: requirements.md exists, all user stories have ACs, FR table has priorities, out-of-scope defined
- Design -> Tasks: design.md exists, has Component Breakdown, references requirements ACs, has Technical Decisions
- Tasks -> Execution: tasks.md exists, has POC-first phases, all tasks have Verify commands, [VERIFY] checkpoints exist

#### US-11: Human Approval Gates (Normal Mode)
**As a** developer
**I want to** the workflow to stop and await my approval after each analysis phase
**So that** I review and correct artifacts before they feed the next phase

**Acceptance Criteria:**
- [ ] AC-11.1: In normal mode, after research, requirements, design, and tasks phases, the plugin sets `awaitingApproval: true` in state
- [ ] AC-11.2: In normal mode, the workflow does NOT auto-proceed to the next phase
- [ ] AC-11.3: User must explicitly run the next phase command (e.g., `/spec-drive:design`) to continue
- [ ] AC-11.4: The state file tracks current phase so `/spec-drive:status` shows where the spec is

#### US-11b: Auto Mode (Full Autonomous Cycle)
**As a** developer
**I want to** a `:auto` mode that runs the entire spec cycle (research → requirements → design → tasks → implement) without stopping for approval
**So that** I can kick off a project and let it run to completion unattended

**Acceptance Criteria:**
- [ ] AC-11b.1: `/spec-drive:new <name> [goal] --auto` runs all phases sequentially without setting `awaitingApproval`
- [ ] AC-11b.2: Phase checklists are still validated between phases — if a checklist fails, auto mode stops with an error
- [ ] AC-11b.3: The stop-watcher hook respects auto mode and continues through phase transitions (not just task execution)
- [ ] AC-11b.4: State file tracks `mode: "auto" | "normal"` to distinguish behavior
- [ ] AC-11b.5: Auto mode still commits each task and produces all artifacts (same quality, no shortcuts)
- [ ] AC-11b.6: `/spec-drive:status` shows that the project is running in auto mode

---

### Feature Area 4: Autonomous Execution Loop

#### US-12: Stop-Watcher Hook for Execution Continuity
**As a** developer
**I want to** the plugin to automatically continue task execution across session stops
**So that** the execution loop runs to completion without manual re-invocation

**Acceptance Criteria:**
- [ ] AC-12.1: A Stop hook reads `.spec-drive-state.json` and outputs a continuation prompt when tasks remain
- [ ] AC-12.2: Hook detects ALL_TASKS_COMPLETE in the transcript and stops the loop
- [ ] AC-12.3: Hook enforces a global iteration limit (default: 100) to prevent infinite loops
- [ ] AC-12.4: Hook handles corrupt state files gracefully (logs error, suggests recovery)
- [ ] AC-12.5: Hook cleans up orphaned temp progress files older than 60 minutes

#### US-13: Task Retry with QA Loop
**As a** developer
**I want to** failed tasks to be retried with failure context from the QA agent
**So that** transient failures and fixable issues are resolved automatically

**Acceptance Criteria:**
- [ ] AC-13.1: On VERIFICATION_FAIL, the task iteration counter increments
- [ ] AC-13.2: Retry receives failure details from QA agent via .progress.md Learnings
- [ ] AC-13.3: Max retry per task is configurable (default: 5)
- [ ] AC-13.4: After max retries, the loop stops with a clear error message

#### US-14: Fresh Context Per Task
**As a** developer
**I want to** each task execution to start with minimal, relevant context
**So that** long specs don't exhaust the context window during execution

**Acceptance Criteria:**
- [ ] AC-14.1: Executor receives ONLY: task definition block from tasks.md + .progress.md
- [ ] AC-14.2: Executor does NOT receive the full spec (research.md, requirements.md, design.md)
- [ ] AC-14.3: Executor does NOT receive previous task definitions or outputs
- [ ] AC-14.4: If executor needs broader context, it reads files on demand (via tools)

#### US-15: Parallel Task Execution
**As a** developer
**I want to** tasks marked [P] to execute in parallel batches
**So that** independent tasks complete faster

**Acceptance Criteria:**
- [ ] AC-15.1: Tasks marked `[P]` in the same phase are dispatched concurrently (max concurrency: configurable via `.spec-drive-config.json`, default 2)
- [ ] AC-15.2: Each parallel executor writes to an isolated `.progress-task-N.md` file
- [ ] AC-15.3: Parallel executors use file locking (flock) for shared resource writes (tasks.md, git)
- [ ] AC-15.4: After a parallel batch completes, progress files are merged into .progress.md

---

### Feature Area 5: State Management

#### US-16: Spec-Drive State File
**As a** developer
**I want to** a `.spec-drive-state.json` file that tracks execution progress
**So that** the workflow can resume after interruptions and provide status

**Acceptance Criteria:**
- [ ] AC-16.1: State file is named `.spec-drive-state.json` (distinct from `.ralph-state.json`)
- [ ] AC-16.2: State file tracks: phase, taskIndex, totalTasks, taskIteration, globalIteration, recoveryMode, parallelMaxConcurrency
- [ ] AC-16.3: State file is updated by commands and the coordinator only — executor is read-only
- [ ] AC-16.4: State file supports `awaitingApproval: boolean` for human review gates
- [ ] AC-16.5: `/spec-drive:status` reads the state file and displays current phase, task progress, and any blockers

---

### Feature Area 6: Plugin Infrastructure

#### US-17: Plugin Scaffold
**As a** developer
**I want to** a properly structured Claude Code plugin with all required directories
**So that** it installs and loads correctly in Claude Code

**Acceptance Criteria:**
- [ ] AC-17.1: Plugin has `plugin.json` with name "spec-drive", version, description
- [ ] AC-17.2: Directory structure follows Claude Code convention: agents/, commands/, skills/, hooks/, templates/, schemas/
- [ ] AC-17.3: Plugin loads without errors when placed in `.claude-plugin/` or installed globally
- [ ] AC-17.4: Plugin has no Python/uv dependencies (Node.js only, per Principle 8)

#### US-18: Slash Commands
**As a** developer
**I want to** slash commands for each workflow action
**So that** I can drive the spec workflow interactively

**Acceptance Criteria:**
- [ ] AC-18.1: Commands exist for: new, research, requirements, design, tasks, implement, status, cancel, help
- [ ] AC-18.2: Each command has a description and argument-hint in its frontmatter
- [ ] AC-18.3: Each command validates prerequisites (previous phase completed) before executing
- [ ] AC-18.4: Each command delegates to the appropriate agent via Task tool (coordinator never implements directly)

#### US-19: Skills for Shared Knowledge
**As a** developer
**I want to** shared skills that encode workflow rules, phase checklists, and communication patterns
**So that** agents share consistent behavior without duplicating instructions

**Acceptance Criteria:**
- [ ] AC-19.1: A "spec-workflow" skill defines phase order, transitions, and checklist criteria
- [ ] AC-19.2: A "delegation-principle" skill instructs the coordinator to never implement directly
- [ ] AC-19.3: A "communication-style" skill enforces concise, fragment-based output
- [ ] AC-19.4: Skills are referenced by agents via SKILL.md + references/ pattern

#### US-20: Document Templates
**As a** developer
**I want to** templates for each document in the chain
**So that** agents produce consistently structured artifacts

**Acceptance Criteria:**
- [ ] AC-20.1: Templates exist for: idea.md, research.md, requirements.md, design.md, tasks.md, .progress.md
- [ ] AC-20.2: Templates define section headings and expected content (not boilerplate filler)
- [ ] AC-20.3: Templates include YAML frontmatter with spec, phase, created fields

#### US-21: Hooks for Lifecycle Management
**As a** developer
**I want to** lifecycle hooks for Stop (execution loop) and SessionStart (context loading)
**So that** the plugin manages its own lifecycle without manual intervention

**Acceptance Criteria:**
- [ ] AC-21.1: hooks.json maps Stop event to the stop-watcher script
- [ ] AC-21.2: hooks.json maps SessionStart event to a context-loader script
- [ ] AC-21.3: Stop hook is the sole mechanism for execution loop continuation
- [ ] AC-21.4: SessionStart hook loads active spec context if one exists

---

### Feature Area 7: Cross-CLI Compatibility

#### US-22: Plain Markdown Artifacts
**As a** developer
**I want to** all spec artifacts to be plain Markdown files
**So that** Codex, Gemini CLI, and Kiro can read them directly without conversion

**Acceptance Criteria:**
- [ ] AC-22.1: All document chain files (idea.md through tasks.md) are plain Markdown with optional YAML frontmatter
- [ ] AC-22.2: No proprietary format, no JSON-only artifacts, no binary files in the spec
- [ ] AC-22.3: A developer using Codex CLI can read and act on any spec artifact without Spec-Drive installed
- [ ] AC-22.4: A developer using Gemini CLI can read and act on any spec artifact without Spec-Drive installed

---

### Feature Area 8: Think-Tank Integration (Development-Time)

#### US-23: Debate-Driven Prompt Finalization
**As a** developer
**I want to** each agent prompt to be stress-tested via think-tank:debate during development
**So that** prompts are adversarially improved before shipping

**Acceptance Criteria:**
- [ ] AC-23.1: Each of the 6 agent prompts is run through `/think-tank:debate` at least once during P283 development
- [ ] AC-23.2: Debate transcripts are stored alongside the finalized prompts as evidence
- [ ] AC-23.3: The improved version from debate replaces the original draft
- [ ] AC-23.4: This is a development-time requirement — the shipped plugin does NOT auto-invoke debate

---

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Plugin creates project-first directory structure `P###-name/spec/` on `/spec-drive:new` | High | Verify directory created with correct structure |
| FR-2 | Document chain: idea.md -> research.md -> requirements.md -> design.md -> tasks.md | High | Each file exists after its phase completes; each reads predecessor |
| FR-3 | 6 role-based agents: researcher, PM, architect, task-planner, executor, QA | High | Each agent file exists in agents/ with original prompt content |
| FR-4 | Phase transition checklists block progression if previous artifact is incomplete | High | Attempt to run next phase without completing checklist fails with clear message |
| FR-5 | Human approval gate after each analysis phase (normal mode) | High | State shows `awaitingApproval: true`; next phase command required |
| FR-5b | Auto mode (`--auto`) runs entire cycle without approval gates | High | All phases complete sequentially; checklists still enforced |
| FR-6 | Stop-watcher hook continues execution loop across session boundaries | High | After session stop, hook outputs continuation prompt; loop resumes |
| FR-7 | QA loop with retry on VERIFICATION_FAIL | High | Failed task retries up to configurable limit with failure context |
| FR-8 | Fresh context per task: executor gets only task + .progress.md | High | Executor invocation does not include full spec files |
| FR-9 | Parallel task support for [P]-marked tasks with file locking | Medium | Parallel tasks complete concurrently; no data corruption |
| FR-10 | `.spec-drive-state.json` tracks phase, taskIndex, retries, progress | High | State file exists, readable via `/spec-drive:status` |
| FR-11 | Slash commands: new, research, requirements, design, tasks, implement, status, cancel, help | High | Each command works, validates prerequisites, delegates correctly |
| FR-12 | Skills for workflow rules, delegation principle, communication style | Medium | Skill files exist and are referenced by agents |
| FR-13 | Document templates for all chain files | Medium | Templates exist with correct structure and frontmatter |
| FR-14 | Cross-CLI artifact compatibility (plain Markdown, no proprietary format) | High | Manual test: open spec artifacts with Codex/Gemini and execute tasks from them |
| FR-15 | Think-tank:debate used on each agent prompt during development | Medium | Debate transcripts stored in repository as evidence |

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | Plugin load time | Time from `claude` start to plugin available | < 2 seconds |
| NFR-2 | Agent prompt token size | Tokens per agent prompt file | < 4,000 tokens each |
| NFR-3 | State file integrity | Corruption resistance | State file validated via jq before read; corrupt state = graceful error |
| NFR-4 | Execution loop safety | Max iterations without human intervention | Configurable, default 100 |
| NFR-5 | No external dependencies | Python/uv/pip packages | Zero (Node.js + bash only) |
| NFR-6 | Artifact portability | CLIs that can consume artifacts natively | 4 (Claude Code, Codex, Gemini, Kiro) |
| NFR-7 | File locking correctness | Parallel task data races | Zero (verified via concurrent execution test) |

---

## Glossary

- **Document Chain**: The ordered sequence idea.md -> research.md -> requirements.md -> design.md -> tasks.md where each document feeds the next
- **Phase Transition Checklist**: A set of quality criteria that must be satisfied before the workflow advances to the next phase
- **Fresh Context**: Executor receives only the current task + .progress.md, not the full spec. Prevents context window exhaustion
- **Stop-Watcher Hook**: A shell script triggered on Claude Code session Stop that reads state and outputs a continuation prompt to resume the execution loop
- **POC-First Decomposition**: Task breakdown philosophy: Phase 1 (Make It Work) -> Phase 2 (Refactor) -> Phase 3 (Test) -> Phase 4 (Quality) -> Phase 5 (PR Lifecycle)
- **[VERIFY] Task**: A checkpoint task delegated to the QA agent for independent verification
- **[P] Task**: A task marked for parallel execution with other [P] tasks in the same batch
- **Project-First Structure**: `P###-name/spec/` directory layout where the project is the root, not a centralized specs/ directory
- **think-tank:debate**: An adversarial review process from the Think Tank plugin (CRITIC -> DEFENDER -> SYNTHESIZER) used to stress-test prompts

## Out of Scope

- **Export command** — artifacts are cross-CLI by design (plain Markdown); no conversion needed
- **Multi-directory path resolution** — one project = one folder; no `ralph_get_specs_dirs()` equivalent
- **Python/uv dependencies** — Node.js only (Principle 8)
- **Antfarm workflow changes** — Spec-Drive is a Claude Code plugin first; Antfarm integration is a future project
- **Migration of existing 100+ specs** — existing specs stay in `specs/p###/` format; Spec-Drive is for new projects
- **Marketplace publishing** — private plugin initially, but designed generically (no MotoBot-specific hardcoding)
- **Plan-synthesizer agent** — quick/single-pass mode deferred to future version
- **Refactor-specialist agent** — post-execution spec updates deferred to future version
- **Constitution phase as a separate step** — idea.md replaces the constitution concept; project constraints go in idea.md
- **EARS notation** — Kiro's requirement syntax not adopted; standard US/AC format maintained
- **Recovery mode with auto-fix task generation** — defer complex auto-recovery to v2

## Dependencies

- **Claude Code v7.3+** — plugin architecture (agents/, commands/, skills/, hooks/)
- **Think Tank Plugin v1.1.1** — debate mode for prompt stress-testing during development
- **jq** — required by hooks for state file parsing
- **flock** — required for parallel task file locking (standard on Linux)
- **Git** — executor commits after each task

## Success Criteria

- All 6 agent prompts finalized and debate-tested (transcripts stored)
- A complete spec cycle (new -> research -> requirements -> design -> tasks -> implement) runs end-to-end on a real project
- Execution loop continues across at least 3 session stops without manual intervention
- QA loop catches at least 1 verification failure and retries successfully
- Spec artifacts from a completed run are readable and actionable by Codex CLI without Spec-Drive installed
- A/B comparison metric: time-to-complete and human intervention count vs ralph-specum on equivalent tasks

---

## Resolved Questions

1. **Plugin home directory**: Plugin de Claude Code — se instala donde corresponda según la convención de plugins de Claude Code. El código fuente vive como repo propio. Los proyectos creados van en `~/spec-drive-projects/`.
2. **Token budget for think-tank:debate**: Lo que lleve, no hay restricción de tokens.
3. **P number assignment**: Mecanismo genérico que funcione para nosotros pero también para otros usuarios. No hardcodear lógica específica de MotoBot/projects.db. El usuario provee el nombre del proyecto; si el nombre empieza con P### se usa tal cual, si no, se usa el nombre como-viene.
4. **Parallel task batch size limit**: Default 2, configurable via `.spec-drive-config.json` en el proyecto.
5. **State file (.spec-drive-state.json)**: NO gitignored — se commitea junto con el spec. Todo se guarda.

## Next Steps

1. Gab reviews and approves requirements
2. Proceed to design phase (`/spec-drive:design`) — architect defines plugin structure, agent prompt architecture, hook implementation
3. Task planning decomposes design into POC-first tasks
4. Implementation begins with plugin scaffold + 4 core agents (researcher, PM, architect, task-planner), then executor + QA
