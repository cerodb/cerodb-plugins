# Tasks: Spec-Drive — Claude Code Plugin for Spec-Driven Development

## Phase 1: Make It Work (POC)

Focus: Scaffold plugin, create all 32 files, validate end-to-end flow with a trivial project. Skip tests. Accept draft-quality agent prompts (debate in Phase 5).

### 1.1 Plugin scaffold + directory structure

- [x] 1.1 Create repo and plugin scaffold
  - **Do**:
    1. `mkdir -p ~/claw-projects/spec-drive`
    2. `cd ~/claw-projects/spec-drive && git init`
    3. Create `.claude-plugin/plugin.json` with name, version 1.0.0, description, license MIT
    4. Create directory tree: `agents/`, `commands/`, `skills/spec-workflow/references/`, `skills/delegation-principle/`, `skills/communication-style/`, `hooks/scripts/`, `templates/`, `schemas/`
    5. Create `package.json` with name, version, scripts (test:structure, test:hooks, test:schema, test:commands)
    6. Create `.gitignore` (node_modules, .DS_Store, *.log)
  - **Files**: `.claude-plugin/plugin.json`, `package.json`, `.gitignore`, all directories via `mkdir -p`
  - **Done when**: `find . -type d | sort` shows all 11 directories; `jq .name .claude-plugin/plugin.json` outputs "spec-drive"
  - **Verify**: `cd ~/claw-projects/spec-drive && jq .name .claude-plugin/plugin.json && test -d agents && test -d commands && test -d hooks/scripts && test -d skills/spec-workflow/references && test -d templates && test -d schemas && echo "PASS"`
  - **Commit**: `feat(scaffold): create spec-drive plugin directory structure`
  - _Requirements: FR-1, AC-17.1, AC-17.2, AC-17.4_
  - _Design: Plugin Directory Structure_

### 1.2 Templates + Schema

- [x] 1.2 [P] Create document templates
  - **Do**:
    1. Create `templates/idea.md` — YAML frontmatter (spec, phase: idea, created) + Vision, Constraints sections
    2. Create `templates/research.md` — frontmatter + Executive Summary, External Research, Codebase Analysis, Feasibility Assessment, Open Questions
    3. Create `templates/requirements.md` — frontmatter + User Stories, Functional Requirements, Non-Functional Requirements, Out of Scope, Glossary
    4. Create `templates/design.md` — frontmatter + Architecture, Components, Data Flow, Technical Decisions, Error Handling
    5. Create `templates/tasks.md` — frontmatter + Phase 1-5 structure with task format (Do/Files/Done when/Verify/Commit)
    6. Create `templates/progress.md` — Original Goal, Completed Tasks, Current Task, Learnings, Blockers, Next
  - **Files**: `templates/idea.md`, `templates/research.md`, `templates/requirements.md`, `templates/design.md`, `templates/tasks.md`, `templates/progress.md`
  - **Done when**: 6 template files exist, each has YAML frontmatter with spec/phase/created fields
  - **Verify**: `cd ~/claw-projects/spec-drive && for f in templates/*.md; do head -1 "$f" | grep -q "^---" && echo "OK: $f" || echo "FAIL: $f"; done | grep -c "OK:" | grep -q "6" && echo "PASS"`
  - **Commit**: `feat(templates): add document chain templates for all 6 phases`
  - _Requirements: FR-13, AC-20.1, AC-20.2, AC-20.3_
  - _Design: Document Chain Flow_

- [x] 1.3 [P] Create state schema + config defaults
  - **Do**:
    1. Create `schemas/spec-drive.schema.json` with JSON Schema for `.spec-drive-state.json` — fields: name, basePath, phase (enum), taskIndex, totalTasks, taskIteration, maxTaskIterations, globalIteration, maxGlobalIterations, awaitingApproval, mode (auto|normal), parallelGroup, taskResults
    2. Include default values in schema (maxTaskIterations: 5, maxGlobalIterations: 100)
  - **Files**: `schemas/spec-drive.schema.json`
  - **Done when**: Schema is valid JSON, defines all state fields per design section 3
  - **Verify**: `cd ~/claw-projects/spec-drive && jq empty schemas/spec-drive.schema.json && jq '.properties.phase' schemas/spec-drive.schema.json | grep -q "enum" && echo "PASS"`
  - **Commit**: `feat(schema): add state file JSON Schema with defaults`
  - _Requirements: FR-10, AC-16.1, AC-16.2_
  - _Design: State Machine_

- [x] 1.4 V1 [VERIFY] Quality checkpoint: structure validation
  - **Do**: Verify scaffold is complete — 8+ directories, plugin.json valid, package.json valid, all templates present, schema valid
  - **Verify**: `cd ~/claw-projects/spec-drive && jq empty .claude-plugin/plugin.json && jq empty package.json && jq empty schemas/spec-drive.schema.json && ls templates/*.md | wc -l | grep -q "6" && echo "PASS"`
  - **Done when**: All JSON files parse, all directories exist, 6 templates present
  - **Commit**: `chore(scaffold): pass structure validation checkpoint` (only if fixes needed)

### 1.3 Skills

- [x] 1.5 Create skills files
  - **Do**:
    1. Create `skills/spec-workflow/SKILL.md` — defines phase order (idea->research->requirements->design->tasks->execution), transition rules, document chain dependencies
    2. Create `skills/spec-workflow/references/phase-transitions.md` — state transitions table (from design section 3)
    3. Create `skills/spec-workflow/references/phase-checklists.md` — 4 transition checklists: research->requirements, requirements->design, design->tasks, tasks->execution (from design section 10)
    4. Create `skills/delegation-principle/SKILL.md` — coordinator never implements directly, always delegates via Task tool
    5. Create `skills/communication-style/SKILL.md` — concise fragment-based output, no fluff, action verbs
  - **Files**: `skills/spec-workflow/SKILL.md`, `skills/spec-workflow/references/phase-transitions.md`, `skills/spec-workflow/references/phase-checklists.md`, `skills/delegation-principle/SKILL.md`, `skills/communication-style/SKILL.md`
  - **Done when**: 5 skill files exist, SKILL.md files have descriptive content (not just placeholders), phase-checklists.md contains all 4 transition definitions
  - **Verify**: `cd ~/claw-projects/spec-drive && test -f skills/spec-workflow/SKILL.md && test -f skills/spec-workflow/references/phase-checklists.md && test -f skills/delegation-principle/SKILL.md && test -f skills/communication-style/SKILL.md && grep -c "research.*requirements\|requirements.*design\|design.*tasks\|tasks.*execution" skills/spec-workflow/references/phase-checklists.md | grep -qE "^[4-9]" && echo "PASS"`
  - **Commit**: `feat(skills): add spec-workflow, delegation-principle, communication-style skills`
  - _Requirements: FR-12, AC-19.1, AC-19.2, AC-19.3, AC-19.4, AC-10.4_
  - _Design: Phase Transition Checklists, Skills_

### 1.4 Hooks

- [x] 1.6 Create hooks.json and hook scripts
  - **Do**:
    1. Create `hooks/hooks.json` — map Stop to stop-watcher.sh, SessionStart to context-loader.sh (using `${CLAUDE_PLUGIN_ROOT}` paths)
    2. Create `hooks/scripts/stop-watcher.sh` — implement algorithm from design section 6:
       - Read JSON stdin (cwd, transcript_path)
       - Project discovery: check cwd/spec/ first, then scan ~/spec-drive-projects/*/spec/
       - Validate state via `jq empty`
       - Check transcript for ALL_TASKS_COMPLETE
       - Check globalIteration limit
       - Check auto mode + phase transitions for auto continuation
       - Output continuation prompt if execution phase + tasks remain
       - Cleanup orphaned .progress-task-*.md > 60 min
    3. Create `hooks/scripts/context-loader.sh` — on session start:
       - Find active project (same discovery)
       - Output phase/progress/approval status to stderr
       - Suggest next command if awaitingApproval
    4. `chmod +x hooks/scripts/*.sh`
  - **Files**: `hooks/hooks.json`, `hooks/scripts/stop-watcher.sh`, `hooks/scripts/context-loader.sh`
  - **Done when**: hooks.json is valid JSON with Stop and SessionStart entries; both scripts are executable; stop-watcher handles all states (no project, awaiting, execution, complete, corrupt)
  - **Verify**: `cd ~/claw-projects/spec-drive && jq '.hooks.Stop' hooks/hooks.json | grep -q "stop-watcher" && jq '.hooks.SessionStart' hooks/hooks.json | grep -q "context-loader" && test -x hooks/scripts/stop-watcher.sh && test -x hooks/scripts/context-loader.sh && echo "PASS"`
  - **Commit**: `feat(hooks): add stop-watcher and context-loader hook scripts`
  - _Requirements: FR-6, AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5, AC-21.1, AC-21.2, AC-21.3, AC-21.4_
  - _Design: Hook Implementation_

- [x] 1.7 V2 [VERIFY] Quality checkpoint: hooks + skills validation
  - **Do**: Validate hooks.json structure, script executability, skill file completeness
  - **Verify**: `cd ~/claw-projects/spec-drive && jq empty hooks/hooks.json && bash -n hooks/scripts/stop-watcher.sh && bash -n hooks/scripts/context-loader.sh && ls skills/*/SKILL.md | wc -l | grep -q "3" && echo "PASS"`
  - **Done when**: JSON valid, shell scripts parse without syntax errors, all 3 SKILL.md files exist
  - **Commit**: `chore(hooks): pass hooks and skills validation checkpoint` (only if fixes needed)

### 1.5 Analysis Agents (4 agents)

- [x] 1.8 [P] Create researcher agent
  - **Do**:
    1. Create `agents/researcher.md` with ORIGINAL prompt (NOT copied from ralph-specum's research-analyst.md)
    2. Frontmatter: name: researcher, description (keyword triggers: "research", "explore feasibility", "prior art"), model: inherit
    3. Prompt structure: Role definition, When Invoked, Input reading (idea.md from basePath), Execution flow (web search + codebase exploration + feasibility), Output format (research.md per template sections), Progress update, `<mandatory>` blocks
    4. Agent reads idea.md path from arguments/context, NOT hardcoded paths
  - **Files**: `agents/researcher.md`
  - **Done when**: Agent file exists with original content, has frontmatter with name/description/model, references idea.md as input, defines research.md output structure
  - **Verify**: `cd ~/claw-projects/spec-drive && head -5 agents/researcher.md | grep -q "name: researcher" && grep -q "idea.md" agents/researcher.md && grep -q "research.md" agents/researcher.md && grep -cq "mandatory" agents/researcher.md && echo "PASS"`
  - **Commit**: `feat(agents): add researcher agent with original prompt`
  - _Requirements: FR-3, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5_
  - _Design: Agent Prompt Architecture_

- [x] 1.9 [P] Create product-manager agent
  - **Do**:
    1. Create `agents/product-manager.md` with ORIGINAL prompt
    2. Frontmatter: name: product-manager, description (triggers: "write requirements", "user stories", "acceptance criteria"), model: inherit
    3. Prompt: reads idea.md + research.md, produces requirements.md with US/AC format, FR/NFR tables, out-of-scope, dependencies
    4. `<mandatory>`: every user story MUST have testable ACs in AC-X.Y format
  - **Files**: `agents/product-manager.md`
  - **Done when**: Agent produces structured requirements with US/AC/FR/NFR format
  - **Verify**: `cd ~/claw-projects/spec-drive && head -5 agents/product-manager.md | grep -q "name: product-manager" && grep -q "idea.md" agents/product-manager.md && grep -q "research.md" agents/product-manager.md && grep -q "AC-" agents/product-manager.md && echo "PASS"`
  - **Commit**: `feat(agents): add product-manager agent with original prompt`
  - _Requirements: FR-3, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5_
  - _Design: Agent Prompt Architecture_

- [x] 1.10 [P] Create architect agent
  - **Do**:
    1. Create `agents/architect.md` with ORIGINAL prompt
    2. Frontmatter: name: architect, description (triggers: "design system", "architecture", "component breakdown"), model: inherit
    3. Prompt: reads idea.md + research.md + requirements.md, produces design.md with Architecture Overview, Components, Data Flow, API/Interface, Technical Decisions (with rationale referencing ACs)
    4. `<mandatory>`: design MUST reference specific AC-X.Y IDs from requirements.md
  - **Files**: `agents/architect.md`
  - **Done when**: Agent references all predecessor files and mandates AC traceability
  - **Verify**: `cd ~/claw-projects/spec-drive && head -5 agents/architect.md | grep -q "name: architect" && grep -q "requirements.md" agents/architect.md && grep -q "AC-" agents/architect.md && echo "PASS"`
  - **Commit**: `feat(agents): add architect agent with original prompt`
  - _Requirements: FR-3, AC-6.1, AC-6.2, AC-6.3, AC-6.4_
  - _Design: Agent Prompt Architecture_

- [x] 1.11 [P] Create task-planner agent
  - **Do**:
    1. Create `agents/task-planner.md` with ORIGINAL prompt
    2. Frontmatter: name: task-planner, description (triggers: "plan tasks", "break down into tasks", "implementation plan"), model: inherit
    3. Prompt: reads requirements.md + design.md, produces tasks.md with POC-first phases (1-5), [P]/[VERIFY] markers, Do/Files/Done when/Verify/Commit format
    4. `<mandatory>`: every task MUST have Verify command, [VERIFY] checkpoints at phase boundaries
  - **Files**: `agents/task-planner.md`
  - **Done when**: Agent mandates POC-first structure with all 5 phases and task format
  - **Verify**: `cd ~/claw-projects/spec-drive && head -5 agents/task-planner.md | grep -q "name: task-planner" && grep -q "requirements.md" agents/task-planner.md && grep -q "design.md" agents/task-planner.md && grep -q "VERIFY" agents/task-planner.md && echo "PASS"`
  - **Commit**: `feat(agents): add task-planner agent with original prompt`
  - _Requirements: FR-3, AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5_
  - _Design: Agent Prompt Architecture_

- [x] 1.12 V3 [VERIFY] Quality checkpoint: 4 analysis agents
  - **Do**: Verify all 4 agents have correct frontmatter, original content, read correct inputs
  - **Verify**: `cd ~/claw-projects/spec-drive && for a in researcher product-manager architect task-planner; do test -f agents/$a.md && grep -q "name: $a" agents/$a.md && echo "OK: $a" || echo "FAIL: $a"; done | grep -c "OK:" | grep -q "4" && echo "PASS"`
  - **Done when**: All 4 agents exist with correct name frontmatter
  - **Commit**: `chore(agents): pass analysis agents validation checkpoint` (only if fixes needed)

### 1.6 Execution Agents

- [x] 1.13 Create executor agent
  - **Do**:
    1. Create `agents/executor.md` with ORIGINAL prompt
    2. Frontmatter: name: executor, description (triggers: "execute task", "implement task", "run task"), model: inherit
    3. Prompt core principles:
       - Receives ONLY current task definition block + .progress.md content (fresh context)
       - NEVER asks user questions — fully autonomous
       - Runs Verify command after implementation
       - Signals TASK_COMPLETE only when verification passes
       - Commits with exact message from task's Commit field
       - Updates .progress.md with completion status + learnings
       - Delegates [VERIFY] tasks to qa-engineer (does not handle them)
    4. `<mandatory>` blocks for: fresh context only, no user questions, verification before complete signal
    5. Include flock instructions for parallel execution (lock patterns for tasks.md and git)
  - **Files**: `agents/executor.md`
  - **Done when**: Agent enforces fresh-context isolation, autonomous execution, and proper signaling
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "TASK_COMPLETE" agents/executor.md && grep -q "progress.md" agents/executor.md && grep -q "mandatory" agents/executor.md && grep -q "flock" agents/executor.md && echo "PASS"`
  - **Commit**: `feat(agents): add executor agent with fresh-context isolation`
  - _Requirements: FR-3, FR-8, AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-8.7, AC-14.1, AC-14.2, AC-14.3_
  - _Design: Execution Engine, Fresh Context Isolation_

- [x] 1.14 Create qa-engineer agent
  - **Do**:
    1. Create `agents/qa-engineer.md` with ORIGINAL prompt
    2. Frontmatter: name: qa-engineer, description (triggers: "verify task", "quality check", "run verification"), model: inherit
    3. Prompt:
       - Receives [VERIFY] task block + requirements.md (for AC checks)
       - Runs verification commands from task's Verify field
       - Checks acceptance criteria against actual implementation
       - Detects mock-only test anti-patterns (high mock ratio, missing real imports)
       - Outputs VERIFICATION_PASS or VERIFICATION_FAIL with specific details
       - On fail: provides clear failure details for retry context
    4. `<mandatory>`: output MUST contain exactly one of VERIFICATION_PASS or VERIFICATION_FAIL
  - **Files**: `agents/qa-engineer.md`
  - **Done when**: Agent produces pass/fail signals with details
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "VERIFICATION_PASS" agents/qa-engineer.md && grep -q "VERIFICATION_FAIL" agents/qa-engineer.md && grep -q "mock" agents/qa-engineer.md && echo "PASS"`
  - **Commit**: `feat(agents): add qa-engineer agent with verification signals`
  - _Requirements: FR-3, FR-7, AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5_
  - _Design: QA Loop_

### 1.7 Commands

- [x] 1.15 Create new.md command
  - **Do**:
    1. Create `commands/new.md` with frontmatter: description, argument-hint (`<name> [goal] [--auto]`), allowed-tools
    2. Parse $ARGUMENTS: extract name, goal, --auto flag
    3. Resolve project path: `~/spec-drive-projects/<name>/spec/` (or custom projectRoot from config)
    4. Create directory structure: `mkdir -p <project>/spec/`
    5. Initialize git repo in `<project>/` if not already a repo
    6. Write idea.md from template + user goal
    7. Write .progress.md from template + original goal
    8. Write .spec-drive-state.json: phase=research, mode=auto|normal
    9. If no goal provided, prompt user before proceeding
    10. Delegate to researcher agent via Task tool
    11. After researcher completes: set awaitingApproval=true (normal mode) or continue to requirements (auto mode)
  - **Files**: `commands/new.md`
  - **Done when**: Command creates project, writes idea.md + .progress.md + state, delegates to researcher
  - **Verify**: `cd ~/claw-projects/spec-drive && head -5 commands/new.md | grep -q "description" && grep -q "spec-drive-projects" commands/new.md && grep -q "idea.md" commands/new.md && grep -q "Task" commands/new.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:new command`
  - _Requirements: FR-1, FR-11, AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-11b.1_
  - _Design: Slash Commands Detail_

- [x] 1.16 [P] Create research.md command
  - **Do**:
    1. Frontmatter: description "Re-run research phase", argument-hint, allowed-tools
    2. Resolve project path (cwd check, then projectRoot scan)
    3. Validate: idea.md exists
    4. Delegate to researcher agent via Task tool (pass basePath)
    5. Set awaitingApproval=true after completion (normal mode)
  - **Files**: `commands/research.md`
  - **Done when**: Command validates prerequisites and delegates to researcher
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "researcher" commands/research.md && grep -q "idea.md" commands/research.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:research command`
  - _Requirements: FR-11, AC-18.1, AC-18.3, AC-18.4_

- [x] 1.17 [P] Create requirements.md command
  - **Do**:
    1. Frontmatter with description, allowed-tools
    2. Resolve project path
    3. Validate research->requirements checklist (from phase-checklists.md): research.md exists, has Executive Summary, Feasibility Assessment, Open Questions
    4. On checklist fail: output specific error, suggest fix
    5. Delegate to product-manager agent via Task tool
    6. Set awaitingApproval=true
  - **Files**: `commands/requirements.md`
  - **Done when**: Command validates phase checklist before delegating to PM
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "product-manager" commands/requirements.md && grep -q "checklist\|Executive Summary\|research.md" commands/requirements.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:requirements command`
  - _Requirements: FR-4, FR-11, AC-10.1, AC-10.2, AC-10.3, AC-18.3_

- [x] 1.18 [P] Create design.md command
  - **Do**:
    1. Frontmatter, resolve path
    2. Validate requirements->design checklist: requirements.md exists, has user stories with ACs, FR table, Out of Scope
    3. Delegate to architect agent
    4. Set awaitingApproval=true
  - **Files**: `commands/design.md`
  - **Done when**: Command validates requirements checklist and delegates to architect
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "architect" commands/design.md && grep -q "requirements.md" commands/design.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:design command`
  - _Requirements: FR-4, FR-11, AC-10.1, AC-18.3_

- [x] 1.19 [P] Create tasks.md command
  - **Do**:
    1. Frontmatter, resolve path
    2. Validate design->tasks checklist: design.md exists, has Components, references AC-* IDs, has Technical Decisions
    3. Delegate to task-planner agent
    4. Set awaitingApproval=true
  - **Files**: `commands/tasks-cmd.md`
  - **Done when**: Command validates design checklist and delegates to task-planner
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "task-planner" commands/tasks-cmd.md && grep -q "design.md" commands/tasks-cmd.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:tasks command`
  - _Requirements: FR-4, FR-11, AC-10.1, AC-18.3_

- [x] 1.20 V4 [VERIFY] Quality checkpoint: commands + agents
  - **Do**: Validate all 6 agents and 5 commands created so far
  - **Verify**: `cd ~/claw-projects/spec-drive && ls agents/*.md | wc -l | grep -q "6" && ls commands/*.md | wc -l | grep -qE "^[5-9]" && for cmd in new research requirements design tasks; do test -f commands/$cmd.md && echo "OK" || echo "FAIL: $cmd"; done | grep -c "OK" | grep -q "5" && echo "PASS"`
  - **Done when**: 6 agents + 5 commands exist
  - **Commit**: `chore(commands): pass commands and agents validation checkpoint` (only if fixes needed)

### 1.8 Implement Command (Coordinator)

- [x] 1.21 Create implement.md command (coordinator)
  - **Do**:
    1. Frontmatter: description "Start autonomous execution loop", allowed-tools (Read, Write, Edit, Bash, Task, Glob, Grep)
    2. Validate tasks->execution checklist: tasks.md exists, has `- [ ]` tasks, has [VERIFY], tasks have Verify: field
    3. Set state: phase=execution, awaitingApproval=false, taskIndex=0, count totalTasks from tasks.md
    4. Coordinator loop logic:
       a. Read state file, determine current task
       b. Parse task block at taskIndex from tasks.md
       c. If [VERIFY] task: delegate to qa-engineer via Task tool
       d. If regular task: delegate to executor via Task tool (pass ONLY task block + .progress.md)
       e. If [P] batch detected: dispatch parallel (respect maxConcurrency)
       f. On TASK_COMPLETE: advance taskIndex, reset taskIteration, update state
       g. On failure: increment taskIteration, append failure to .progress.md, retry
       h. On max retries: stop with error
       i. When taskIndex >= totalTasks: output ALL_TASKS_COMPLETE
    5. `<mandatory>`: NEVER implement tasks directly. ALWAYS delegate via Task tool.
  - **Files**: `commands/implement.md`
  - **Done when**: Coordinator prompt handles sequential + parallel dispatch, retry logic, completion detection
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "Task tool\|Task(" commands/implement.md && grep -q "ALL_TASKS_COMPLETE" commands/implement.md && grep -q "VERIFY" commands/implement.md && grep -q "taskIndex" commands/implement.md && grep -q "parallel\|\\[P\\]" commands/implement.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:implement coordinator command`
  - _Requirements: FR-6, FR-7, FR-8, FR-9, AC-8.7, AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-15.1, AC-15.2, AC-15.3, AC-15.4_
  - _Design: Execution Engine_

### 1.9 Remaining Commands

- [x] 1.22 [P] Create status.md command
  - **Do**:
    1. Reads .spec-drive-state.json directly (no agent delegation)
    2. Displays: project name, phase, task progress (X/Y), mode (auto/normal), awaitingApproval, current task name, blockers from .progress.md
    3. If no active project found: output helpful message
  - **Files**: `commands/status.md`
  - **Done when**: Shows all state fields in readable format
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "spec-drive-state.json" commands/status.md && grep -q "phase\|taskIndex\|awaitingApproval" commands/status.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:status command`
  - _Requirements: FR-11, AC-16.5, AC-11.4, AC-11b.6_

- [x] 1.23 [P] Create cancel.md command
  - **Do**:
    1. Finds active project
    2. Deletes .spec-drive-state.json
    3. Offers to delete entire project dir (but keeps by default)
    4. No agent delegation — direct action
  - **Files**: `commands/cancel.md`
  - **Done when**: Cancels execution cleanly by removing state
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -q "spec-drive-state.json" commands/cancel.md && grep -q "delete\|remove\|rm" commands/cancel.md && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:cancel command`
  - _Requirements: FR-11, AC-18.1_

- [x] 1.24 [P] Create help.md command
  - **Do**:
    1. Lists all 9 commands with descriptions and usage examples
    2. Shows workflow diagram (text-based)
    3. No agent delegation — outputs help text
  - **Files**: `commands/help.md`
  - **Done when**: All 9 commands listed with descriptions
  - **Verify**: `cd ~/claw-projects/spec-drive && grep -c "spec-drive:" commands/help.md | grep -qE "^[8-9]$|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(commands): add /spec-drive:help command`
  - _Requirements: FR-11, AC-18.1_

- [x] 1.25 V5 [VERIFY] Quality checkpoint: all 32 files
  - **Do**: Count all plugin files and validate completeness
  - **Verify**: `cd ~/claw-projects/spec-drive && TOTAL=$(find . -name "*.md" -o -name "*.json" -o -name "*.sh" | grep -v node_modules | grep -v .git | wc -l) && echo "Total files: $TOTAL" && test $TOTAL -ge 30 && echo "PASS (>=30 files)"`
  - **Done when**: At least 30 of the 32 expected files exist
  - **Commit**: `chore(plugin): pass full file count validation` (only if fixes needed)

### 1.10 POC End-to-End Validation

- [x] 1.26 POC Checkpoint: end-to-end smoke test
  - **Do**:
    1. Create a test project directory: `mkdir -p /tmp/spec-drive-e2e-test/spec`
    2. Write a minimal idea.md: `echo "---\nspec: test\nphase: idea\n---\n# Test Project\nBuild a hello world CLI" > /tmp/spec-drive-e2e-test/spec/idea.md`
    3. Write a minimal .spec-drive-state.json with phase=execution, taskIndex=0, totalTasks=1
    4. Write a minimal tasks.md with 1 trivial task (create a file)
    5. Write a .progress.md with original goal
    6. Feed mock JSON to stop-watcher.sh: `echo '{"cwd":"/tmp/spec-drive-e2e-test"}' | bash ~/claw-projects/spec-drive/hooks/scripts/stop-watcher.sh`
    7. Verify stop-watcher outputs continuation prompt (not empty, contains "Continue spec")
    8. Test context-loader.sh: `echo '{"cwd":"/tmp/spec-drive-e2e-test"}' | bash ~/claw-projects/spec-drive/hooks/scripts/context-loader.sh 2>&1`
    9. Verify all 9 commands have frontmatter with description field
    10. Verify all 6 agents have frontmatter with name field
    11. Cleanup: `rm -rf /tmp/spec-drive-e2e-test`
  - **Files**: (temporary test files only)
  - **Done when**: Stop-watcher produces continuation prompt, context-loader outputs status, all commands/agents have proper frontmatter
  - **Verify**: `cd ~/claw-projects/spec-drive && mkdir -p /tmp/spec-drive-e2e-test/spec && echo '{"name":"test","basePath":"/tmp/spec-drive-e2e-test/spec","phase":"execution","taskIndex":0,"totalTasks":1,"taskIteration":1,"maxTaskIterations":5,"globalIteration":1,"maxGlobalIterations":100,"awaitingApproval":false,"mode":"normal","parallelGroup":null,"taskResults":{}}' > /tmp/spec-drive-e2e-test/spec/.spec-drive-state.json && echo '---' > /tmp/spec-drive-e2e-test/spec/tasks.md && echo 'spec: test' >> /tmp/spec-drive-e2e-test/spec/tasks.md && echo '---' >> /tmp/spec-drive-e2e-test/spec/tasks.md && echo '- [ ] 1.1 Test task' >> /tmp/spec-drive-e2e-test/spec/tasks.md && echo '  - **Verify**: echo ok' >> /tmp/spec-drive-e2e-test/spec/tasks.md && OUTPUT=$(echo '{"cwd":"/tmp/spec-drive-e2e-test"}' | bash hooks/scripts/stop-watcher.sh 2>/dev/null) && echo "$OUTPUT" | grep -q "Continue\|Resume\|spec\|task" && rm -rf /tmp/spec-drive-e2e-test && echo "PASS"`
  - **Commit**: `feat(poc): complete end-to-end smoke test validation`
  - _Requirements: Success Criteria — complete spec cycle; FR-6_
  - _Design: Hook Implementation, Execution Engine_

---

## Phase 2: Refactoring

Focus: Clean up prompts, improve error handling, ensure consistency across all files.

- [x] 2.1 Standardize command pattern
  - **Do**:
    1. Review all 9 commands for consistent structure: frontmatter, argument parsing, project resolution, prerequisite validation, agent delegation, state update
    2. Extract common patterns into comments/documentation within each command
    3. Ensure all commands handle "no active project" gracefully
    4. Ensure auto mode propagation: if mode=auto in state, analysis phase commands auto-continue to next phase
    5. Verify all commands reference skills (spec-workflow, delegation-principle, communication-style)
  - **Files**: `commands/new.md`, `commands/research.md`, `commands/requirements.md`, `commands/design.md`, `commands/tasks.md`, `commands/implement.md`, `commands/status.md`, `commands/cancel.md`, `commands/help.md`
  - **Done when**: All commands follow identical structure pattern, handle edge cases, reference skills
  - **Verify**: `cd ~/claw-projects/spec-drive && for cmd in commands/*.md; do grep -q "allowed-tools\|description" "$cmd" && echo "OK: $cmd" || echo "FAIL: $cmd"; done | grep -c "OK:" | grep -q "9" && echo "PASS"`
  - **Commit**: `refactor(commands): standardize command structure and error handling`
  - _Design: Slash Commands Detail, Error Handling_

- [x] 2.2 Improve agent prompt quality
  - **Do**:
    1. Review each agent for: clear role definition, explicit input/output, `<mandatory>` blocks for constraints, no ralph-specum copied text
    2. Ensure executor has explicit flock patterns documented
    3. Ensure qa-engineer has mock detection heuristics
    4. Add "Output Format" section to each agent with exact file structure expected
    5. Verify token budget: rough estimate each prompt stays under ~4000 tokens
  - **Files**: `agents/researcher.md`, `agents/product-manager.md`, `agents/architect.md`, `agents/task-planner.md`, `agents/executor.md`, `agents/qa-engineer.md`
  - **Done when**: All agents have polished, complete prompts with clear boundaries
  - **Verify**: `cd ~/claw-projects/spec-drive && for a in agents/*.md; do wc -w "$a"; done | awk '{if($1>3000) print "WARN: "$2" may exceed token budget"}' && echo "PASS"`
  - **Commit**: `refactor(agents): polish agent prompts and add output format sections`
  - _Requirements: NFR-2_
  - _Design: Agent Prompt Architecture_

- [x] 2.3 Harden hook scripts
  - **Do**:
    1. Add shellcheck-compatible patterns (proper quoting, set -euo pipefail)
    2. Add config file discovery (project > global > defaults) for projectRoot
    3. Add state file mtime race check (if modified < 2s ago, wait 1s)
    4. Add auto mode handling in stop-watcher: if mode=auto and phase is not execution, output auto-continuation prompt for next analysis phase
    5. Ensure proper JSON output escaping
  - **Files**: `hooks/scripts/stop-watcher.sh`, `hooks/scripts/context-loader.sh`
  - **Done when**: Scripts pass `bash -n`, handle race conditions, support auto mode
  - **Verify**: `cd ~/claw-projects/spec-drive && bash -n hooks/scripts/stop-watcher.sh && bash -n hooks/scripts/context-loader.sh && grep -q "pipefail\|set -e" hooks/scripts/stop-watcher.sh && echo "PASS"`
  - **Commit**: `refactor(hooks): harden scripts with proper error handling and auto mode`
  - _Requirements: AC-11b.3, AC-12.4_
  - _Design: Edge Cases_

- [x] 2.4 V6 [VERIFY] Quality checkpoint: post-refactor validation
  - **Do**: Run all structural checks after refactoring
  - **Verify**: `cd ~/claw-projects/spec-drive && jq empty .claude-plugin/plugin.json && jq empty schemas/spec-drive.schema.json && jq empty hooks/hooks.json && bash -n hooks/scripts/*.sh && ls agents/*.md | wc -l | grep -q "6" && ls commands/*.md | wc -l | grep -q "9" && ls templates/*.md | wc -l | grep -q "6" && echo "PASS"`
  - **Done when**: All files valid, correct counts
  - **Commit**: `chore(refactor): pass post-refactor validation checkpoint` (only if fixes needed)

---

## Phase 3: Testing

Focus: Smoke tests, hook unit tests, integration validation.

- [x] 3.1 Implement npm test:structure script
  - **Do**:
    1. Create `scripts/test-structure.sh` — verifies all 32 expected files exist
    2. Checks: .claude-plugin/plugin.json, all 6 agents, all 9 commands, all 5 skill files, hooks.json + 2 scripts, 6 templates, 1 schema, package.json
    3. Exit 0 on pass, exit 1 on fail with missing file list
    4. Wire into package.json: `"test:structure": "bash scripts/test-structure.sh"`
  - **Files**: `scripts/test-structure.sh`, `package.json` (update scripts)
  - **Done when**: `npm run test:structure` exits 0 with all files present
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:structure`
  - **Commit**: `test(structure): add plugin structure validation script`
  - _Design: Test Strategy — Smoke Tests_

- [x] 3.2 Implement npm test:hooks script
  - **Do**:
    1. Create `scripts/test-hooks.sh` — validates hook functionality:
       a. hooks.json is valid JSON with Stop and SessionStart
       b. Both scripts are executable
       c. Feed mock states to stop-watcher:
          - No project (empty cwd) -> no output
          - Execution in progress -> continuation prompt
          - ALL_TASKS_COMPLETE in transcript -> no output
          - Corrupt state -> recovery instructions
          - Max iterations -> error output
          - awaitingApproval=true -> no continuation (normal mode)
       d. Feed mock states to context-loader and verify stderr output
    2. Wire into package.json: `"test:hooks": "bash scripts/test-hooks.sh"`
  - **Files**: `scripts/test-hooks.sh`, `package.json` (update scripts)
  - **Done when**: `npm run test:hooks` exits 0, covers all stop-watcher states
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:hooks`
  - **Commit**: `test(hooks): add hook unit tests for all state transitions`
  - _Requirements: AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5_
  - _Design: Test Strategy — Unit Tests_

- [x] 3.3 Implement npm test:commands script
  - **Do**:
    1. Create `scripts/test-commands.sh` — validates all command files:
       a. Each has YAML frontmatter with `description` field
       b. Each has `argument-hint` or `allowed-tools`
       c. Analysis commands (requirements, design, tasks) reference checklist validation
       d. Commands that delegate reference Task tool
    2. Wire into package.json
  - **Files**: `scripts/test-commands.sh`, `package.json` (update scripts)
  - **Done when**: `npm run test:commands` exits 0
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:commands`
  - **Commit**: `test(commands): add command frontmatter and delegation validation`
  - _Design: Test Strategy — Smoke Tests_

- [x] 3.4 Implement npm test:schema script
  - **Do**:
    1. Create `scripts/test-schema.sh` — validates:
       a. Schema file is valid JSON
       b. Schema defines all required state fields
       c. Phase enum contains all valid phases
       d. Default values present for maxTaskIterations, maxGlobalIterations
    2. Wire into package.json
  - **Files**: `scripts/test-schema.sh`, `package.json` (update scripts)
  - **Done when**: `npm run test:schema` exits 0
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:schema`
  - **Commit**: `test(schema): add schema validation script`
  - _Design: Test Strategy — Smoke Tests_

- [x] 3.5 V7 [VERIFY] Quality checkpoint: all tests pass
  - **Do**: Run all test scripts
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:structure && npm run test:hooks && npm run test:commands && npm run test:schema && echo "ALL TESTS PASS"`
  - **Done when**: All 4 test scripts exit 0
  - **Commit**: `chore(tests): pass all test suites checkpoint` (only if fixes needed)

- [x] 3.6 Cross-CLI artifact validation
  - **Do**:
    1. Create `scripts/test-cross-cli.sh`:
       a. Create temp project with all spec artifacts (idea.md through tasks.md)
       b. Verify each file is plain Markdown (no proprietary format)
       c. Verify YAML frontmatter is standard (parseable by any YAML parser)
       d. Verify no template variables (`{{...}}`) in any output file
       e. Verify files are self-contained (readable without Spec-Drive)
    2. Wire into package.json: `"test:cross-cli": "bash scripts/test-cross-cli.sh"`
  - **Files**: `scripts/test-cross-cli.sh`, `package.json`
  - **Done when**: `npm run test:cross-cli` verifies artifact portability
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:cross-cli`
  - **Commit**: `test(cross-cli): add artifact portability validation`
  - _Requirements: FR-14, AC-22.1, AC-22.2, AC-22.3, AC-22.4_
  - _Design: Cross-CLI Compatibility_

---

## Phase 4: Quality Gates

- [x] 4.1 V8 [VERIFY] Full local validation
  - **Do**: Run ALL quality checks:
    1. Structure test
    2. Hooks test
    3. Commands test
    4. Schema test
    5. Cross-CLI test
    6. Verify all files counted (>=32)
    7. Verify git repo is clean (no uncommitted changes)
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:structure && npm run test:hooks && npm run test:commands && npm run test:schema && npm run test:cross-cli && echo "ALL QUALITY GATES PASS"`
  - **Done when**: All tests pass, repo is clean
  - **Commit**: `chore(quality): pass full local validation` (if fixes needed)

- [x] 4.2 Create PR and verify CI
  - **Do**:
    1. Verify on feature branch (main or initial commit for new repo)
    2. Create remote repo: `gh repo create cerodb/spec-drive --private --source=. --remote=origin`
    3. Push: `git push -u origin main`
    4. (No PR needed for initial repo — this is the first commit to main of a new repo)
    5. Verify repo exists and all files pushed
  - **Verify**: `cd ~/claw-projects/spec-drive && gh repo view cerodb/spec-drive --json name 2>/dev/null | jq -r .name | grep -q "spec-drive" && echo "PASS"`
  - **Done when**: Remote repo exists with all plugin files
  - **Commit**: None (push only)

---

## Phase 5: Think-Tank Debate (Prompt Stress-Testing)

Focus: Each of the 6 agent prompts goes through `/think-tank:debate` to adversarially improve quality. This is a development-time requirement (AC-23.1 through AC-23.4).

Status note as of 2026-03-29:
- `5.1` and `5.2` are fully marked complete.
- `5.3`, `5.5`, `5.6`, and `5.7` have already received material prompt hardening work, but the evidence quality is mixed:
  - `architect` and `task-planner` were improved through lighter Claude consultations rather than clean full think-tank transcripts.
  - `executor` and `qa-engineer` were improved through monitored single-agent passes with partial but useful think-tank transcripts normalized into `agents/adversarial/`.
- Those four tasks remain unchecked on purpose until we either:
  1. run cleaner formal debate passes, or
  2. explicitly decide to accept the pragmatic evidence and close them with caveat.

- [x] 5.1 Debate: researcher agent prompt
  - **Do**:
    1. Run `/think-tank:debate ~/claw-projects/spec-drive/agents/researcher.md --output-dir ~/claw-projects/spec-drive/agents/adversarial`
    2. Review improved version from synthesizer
    3. If improved version is genuinely better (not lateral/regression per diff-eval), replace original
    4. Keep debate transcript as evidence
  - **Files**: `agents/researcher.md` (updated), `agents/adversarial/debate-*.md` (transcript)
  - **Done when**: Debate transcript exists, agent prompt updated with improvements
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | head -1 | grep -q "debate" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test researcher prompt via think-tank:debate`
  - _Requirements: FR-15, AC-4.6, AC-23.1, AC-23.2, AC-23.3_

- [x] 5.2 Debate: product-manager agent prompt
  - **Do**: Same as 5.1 but for `agents/product-manager.md`
  - **Files**: `agents/product-manager.md`, `agents/adversarial/debate-*.md`
  - **Done when**: Debate transcript exists
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[2-9]|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test product-manager prompt via think-tank:debate`
  - _Requirements: FR-15, AC-5.6, AC-23.1_

- [x] 5.3 Debate: architect agent prompt
  - **Do**: Same pattern for `agents/architect.md`
  - **Files**: `agents/architect.md`, `agents/adversarial/debate-*.md`
  - **Done when**: Debate transcript exists
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[3-9]|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test architect prompt via think-tank:debate`
  - _Requirements: FR-15, AC-6.5, AC-23.1_

- [x] 5.4 V9 [VERIFY] Quality checkpoint: 3 debate transcripts
  - **Do**: Verify first 3 debate transcripts exist
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[3-9]" && echo "PASS"`
  - **Done when**: At least 3 debate transcript files exist
  - **Commit**: `chore(debate): pass debate transcript checkpoint` (only if fixes needed)

- [x] 5.5 Debate: task-planner agent prompt
  - **Do**: Same pattern for `agents/task-planner.md`
  - **Files**: `agents/task-planner.md`, `agents/adversarial/debate-*.md`
  - **Done when**: Debate transcript exists
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[4-9]|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test task-planner prompt via think-tank:debate`
  - _Requirements: FR-15, AC-7.6, AC-23.1_

- [x] 5.6 Debate: executor agent prompt
  - **Do**: Same pattern for `agents/executor.md`
  - **Files**: `agents/executor.md`, `agents/adversarial/debate-*.md`
  - **Done when**: Debate transcript exists
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[5-9]|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test executor prompt via think-tank:debate`
  - _Requirements: FR-15, AC-23.1_

- [x] 5.7 Debate: qa-engineer agent prompt
  - **Do**: Same pattern for `agents/qa-engineer.md`
  - **Files**: `agents/qa-engineer.md`, `agents/adversarial/debate-*.md`
  - **Done when**: All 6 debate transcripts exist
  - **Verify**: `ls ~/claw-projects/spec-drive/agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[6-9]|^[1-9][0-9]" && echo "PASS"`
  - **Commit**: `feat(agents): stress-test qa-engineer prompt via think-tank:debate`
  - _Requirements: FR-15, AC-23.1_

- [x] 5.8 V10 [VERIFY] Final validation: all 6 debates complete
  - **Do**:
    1. Count debate transcripts: expect >= 6
    2. Run full test suite one more time
    3. Verify git log shows all expected commits
  - **Verify**: `cd ~/claw-projects/spec-drive && ls agents/adversarial/debate-*.md 2>/dev/null | wc -l | grep -qE "^[6-9]|^[1-9][0-9]" && npm run test:structure && npm run test:hooks && echo "PASS"`
  - **Done when**: 6+ debate transcripts, all tests green
  - **Commit**: `chore(debate): all 6 agent prompts debate-tested`

---

## Phase 6: PR Lifecycle

- [x] 6.1 V11 [VERIFY] AC checklist
  - **Do**: Programmatically verify each acceptance criteria grouping:
    1. AC-1.*: new command creates project structure with idea.md
    2. AC-2.*: document chain — each agent reads correct predecessors
    3. AC-3.*: .progress.md exists in templates and is referenced by agents
    4. AC-4-9.*: all 6 agents exist with original prompts
    5. AC-10.*: phase checklists defined in skill reference file
    6. AC-11.*: awaitingApproval handled in commands
    7. AC-11b.*: auto mode flag in new command and state
    8. AC-12.*: stop-watcher handles all states
    9. AC-13.*: retry logic in implement command
    10. AC-14.*: executor receives only task + progress
    11. AC-15.*: parallel [P] support in implement
    12. AC-16.*: state file schema complete
    13. AC-17.*: plugin structure valid
    14. AC-18.*: all 9 commands exist
    15. AC-19.*: all 3 skills exist
    16. AC-20.*: all 6 templates exist
    17. AC-21.*: hooks.json maps both events
    18. AC-22.*: artifacts are plain Markdown
    19. AC-23.*: debate transcripts exist for all 6 agents
  - **Verify**: `cd ~/claw-projects/spec-drive && npm run test:structure && npm run test:hooks && npm run test:commands && npm run test:schema && npm run test:cross-cli && ls agents/adversarial/debate-*.md | wc -l | grep -qE "^[6-9]" && echo "ALL AC VERIFIED"`
  - **Done when**: Every AC group confirmed via automated check
  - **Commit**: None

- [ ] 6.2 Push final state and tag release
  - **Do**:
    1. Push all commits to remote
    2. Tag release: `git tag v1.0.0 && git push origin v1.0.0`
    3. Verify remote is complete
  - **Verify**: `cd ~/claw-projects/spec-drive && git push origin main && git tag v1.0.0 && git push origin v1.0.0 && gh repo view cerodb/spec-drive --json name | jq -r .name | grep -q "spec-drive" && echo "PASS"`
  - **Done when**: v1.0.0 tag pushed, remote up to date
  - **Commit**: None (tag only)

---

## Notes

### POC shortcuts taken (Phase 1)
- Agent prompts are first-draft quality (debate-tested in Phase 5)
- No test scripts exist until Phase 3
- Auto mode support is basic (flag parsing + state field, full chain tested manually)
- Parallel execution documented in executor prompt but not integration-tested until Phase 3
- No npm publish or marketplace listing

### Production TODOs (post-v1.0.0)
- Plugin marketplace publishing (if demand warrants)
- `.spec-drive-config.json` editor command
- Recovery mode with auto-fix task generation (deferred per requirements)
- Plan-synthesizer agent (deferred per requirements)
- Refactor-specialist agent (deferred per requirements)
- Antfarm integration
- Real-project integration test (run Spec-Drive on a non-trivial project end-to-end)

### Task dependency notes
- Tasks 1.2 and 1.3 are parallel (no deps)
- Tasks 1.8-1.11 are parallel (4 analysis agents, independent)
- Tasks 1.16-1.19 are parallel (4 phase commands, independent)
- Tasks 1.22-1.24 are parallel (status, cancel, help)
- Task 1.13 (executor) depends on 1.5 (skills — executor references delegation-principle)
- Task 1.21 (implement) depends on 1.13+1.14 (executor + qa agents must exist)
- Phase 5 debate tasks are sequential (think-tank runs one at a time)
- Phase 5 depends on Phase 2 (prompts must be polished before debate)
