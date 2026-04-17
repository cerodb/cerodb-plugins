---
spec: p283-claw-specum
phase: research
created: 2026-03-28T18:00:00Z
---

# Research: P283 Claw Specum

## Executive Summary

Claw Specum is feasible as a Claude Code plugin that works standalone AND integrates with Antfarm. The plugin should reuse ralph-specum's proven architecture (agents/, skills/, commands/, hooks/, templates/) while adding three key innovations: a constitution phase borrowed from Spec-Kit (P265), think-tank:debate integration for adversarial stress-testing of spec artifacts, and a cross-CLI-portable artifact format that Codex, Gemini CLI, and Kiro can consume natively. The project-first directory structure (P###-name/spec/) is achievable but requires Antfarm workflow changes to `spec_dir` resolution.

## External Research

### Claude Code Plugin Architecture (2026)

Plugin structure as of Claude Code v7.3.0:

```
.claude-plugin/plugin.json    # Metadata (required)
agents/                        # Agent definitions (.md with YAML frontmatter)
commands/                      # Slash commands (.md with frontmatter)
skills/                        # Skills (SKILL.md + references/)
hooks/                         # Lifecycle hooks (hooks.json + scripts/)
templates/                     # Document templates
schemas/                       # JSON schemas
```

Key patterns from ralph-specum (v3.1.2, MIT, author: tzachbon):
- Agent prompts are `.md` files with `name`, `description`, `model` frontmatter
- Skills use `SKILL.md` with `name`, `description` frontmatter + `references/` subdirectory
- Commands use `.md` with `description`, `argument-hint`, `allowed-tools` frontmatter
- Hooks use `hooks.json` mapping lifecycle events (Stop, SessionStart) to shell scripts
- State managed via `.ralph-state.json` (phase, taskIndex, iterations)
- Phase transitions: research -> requirements -> design -> tasks -> execution
- Each phase sets `awaitingApproval: true` for human review gate

**Source**: [Claude Code plugin docs](https://code.claude.com/docs/en/plugins), [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

### Cross-CLI Context Loading Formats

| CLI | Context File | Discovery | Format |
|-----|-------------|-----------|--------|
| Claude Code | `CLAUDE.md` | Hierarchical (project root + subdirs) | Markdown |
| Codex CLI | `AGENTS.md` | Hierarchical (home + project root down to cwd) | Markdown |
| Gemini CLI | `GEMINI.md` | Hierarchical (home + workspace dirs + per-access discovery) | Markdown |
| Kiro | `.kiro/specs/`, `.kiro/steering/` | Fixed directory structure | Markdown + EARS notation |

**Key insight**: All four CLIs load plain Markdown files. The artifact format is already compatible. The difference is HOW they discover files:
- Claude Code: loads plugins via `.claude-plugin/` + `CLAUDE.md`
- Codex: reads `AGENTS.md` walking down from project root, 32KB limit
- Gemini: reads `GEMINI.md` hierarchically, auto-discovers on file access
- Kiro: reads `.kiro/specs/<feature>/` with requirements.md, design.md, tasks.md

**Compatibility strategy**: Keep spec artifacts as plain Markdown with YAML frontmatter. Provide a thin adapter per CLI that generates the right context file pointing to spec artifacts.

**Sources**: [Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md), [Gemini CLI GEMINI.md](https://geminicli.com/docs/cli/gemini-md/), [Kiro specs docs](https://kiro.dev/docs/specs/)

### Spec-Kit (P265) Borrowings

From the P265 evaluation (2026-03-22):

1. **Constitution phase**: Add a "phase 0" that loads `principles.md` + project-specific constraints before research. Template variable `{{constitution_context}}` available to all agents. Effort: ~2-4h.

2. **Phase checklists**: Each phase has explicit quality gates before transition. Already partially implemented in ralph-specum via `awaitingApproval`, but Spec-Kit's approach of explicit "Analyze" sub-phase for cross-artifact validation is worth borrowing.

3. **Spec prompt pack**: Self-contained artifact set that any CLI can consume. The "spec as executable artifact" philosophy aligns with our cross-CLI goal.

**Discarded from Spec-Kit**: Manual orchestration (Antfarm is superior), Python CLI dependency, agent-agnostic-at-cost-of-depth approach.

**Source**: `/home/motobot/claw-projects/research/p265-spec-kit-vs-motobot-workflow.md`

### Kiro Spec Format Analysis

Kiro uses EARS (Easy Approach to Requirements Syntax) notation:
- `WHEN [condition/event] THE SYSTEM SHALL [expected behavior]`
- `.kiro/specs/<feature>/requirements.md` + `design.md` + `tasks.md`
- `.kiro/steering/` for product.md, structure.md, tech.md (similar to constitution)

Kiro automatically includes all spec files in conversation context. This is the same "specs as context" philosophy we want.

**Source**: [Kiro specs docs](https://kiro.dev/docs/specs/), [Kiro best practices](https://kiro.dev/docs/specs/best-practices/)

### Think-Tank Debate Integration

think-tank v1.1.1 (cerodb/think-tank, PUBLIC):
- Modes: debate, review, brainstorm, hypothesis, cross-agent
- Debate pipeline: CRITIC -> DEFENDER (N rounds) -> SYNTHESIZER -> DIFF EVALUATOR
- Invocation: `/think-tank:debate <file-path> [--rounds N] [--output-dir DIR]`
- Internally calls `claude -p` subprocesses (~40K tokens per run, ~8 min for 200 lines)
- Output: 3 files in `adversarial/` subdir (debate transcript, improved doc, diff eval)

**Integration approach**: After each spec phase generates its artifact (research.md, requirements.md, design.md), auto-invoke think-tank:debate on it. The improved version replaces the original. The debate transcript is stored alongside as evidence.

**Concern**: Token cost. 40K tokens x 4 phases = 160K tokens overhead. Mitigations:
- Make debate optional per phase (flag `--debate` or `--no-debate`)
- Default: debate only requirements.md and design.md (highest impact)
- Skip debate on research.md (low value for adversarial review)
- Skip debate on tasks.md (too mechanical/structured for debate value)

**Source**: `/home/motobot/ai-Projects/think-tank/README.md`, `/home/motobot/ai-Projects/think-tank/plugins/think-tank/commands/debate.md`

## Codebase Analysis

### Ralph-Specum Plugin Structure (v3.1.2)

Full inventory of what we're inspired by:

**Agents (8)**:
| Agent | Role | Purpose |
|-------|------|---------|
| research-analyst | analysis | Web search, codebase exploration, feasibility |
| product-manager | analysis | User stories, acceptance criteria, FR/NFR |
| architect-reviewer | analysis | Architecture, components, data flow, decisions |
| task-planner | analysis | POC-first breakdown, quality checkpoints |
| spec-executor | coding | Autonomous task execution, one task at a time |
| qa-engineer | verification | [VERIFY] task execution, mock quality checks |
| plan-synthesizer | analysis | Quick mode: all artifacts in one pass |
| refactor-specialist | analysis | Post-execution spec updates |

**Skills (5)**:
| Skill | Purpose |
|-------|---------|
| spec-workflow | Phase commands, transitions, workflow overview |
| smart-ralph | Common args, execution modes, state management |
| interview-framework | User goal elicitation |
| reality-verification | Fix goal detection, BEFORE/AFTER verification |
| communication-style | Output formatting rules |
| delegation-principle | Subagent delegation patterns |

**Commands (11)**: new, start, research, requirements, design, tasks, implement, status, switch, cancel, help, index, feedback, refactor

**Hooks**: Stop (loop controller for task execution), SessionStart (context loader)

**Templates (7)**: research.md, requirements.md, design.md, tasks.md, progress.md, settings-template.md, component-spec.md, external-spec.md, index-summary.md

**Schema**: spec.schema.json — defines state file, task structure, frontmatter formats

**Source**: `/home/motobot/ai-Projects/smart-ralph-main/plugins/ralph-specum/`

### Antfarm Workflow Integration

Current spec-dev workflow (`~/claw-projects/antfarm/workflows/spec-dev/workflow.yml`):
- 6 steps: research -> requirements -> design -> plan-tasks -> implement (loop) -> verify
- Each agent has its own `AGENTS.md` in `agents/<role>/`
- Context passed via template variables: `{{research_summary}}`, `{{quality_cmds}}`, etc.
- Implement step is a loop over `stories` with `fresh_session: true`
- Verify step retries via `retry_step: implement`
- Context vars: `repo`, `spec_dir`

Feature-dev workflow (`~/claw-projects/antfarm/workflows/feature-dev/workflow.yml`):
- 7 steps: plan -> setup -> implement (loop) -> verify -> test -> pr -> review
- Same loop/verify pattern but includes PR creation and code review

**Key integration point**: `context.spec_dir` in workflow.yml currently set to `~/claw-projects/specs`. The plugin generates artifacts; Antfarm consumes them. They must agree on path.

**Source**: `/home/motobot/claw-projects/antfarm/workflows/spec-dev/workflow.yml`, `/home/motobot/claw-projects/antfarm/workflows/feature-dev/workflow.yml`

### Existing Spec Artifact Patterns

Current specs live in `~/claw-projects/specs/p###-name/` (also mirrored in `~/.openclaw/workspace/specs/`). Each contains:
- `research.md` — YAML frontmatter + findings
- `requirements.md` — User stories, FR/NFR, acceptance criteria
- `design.md` — Architecture, components, decisions
- `tasks.md` — POC-first phases, [VERIFY] checkpoints
- `.progress.md` — Execution state
- `.ralph-state.json` — Workflow state

All use consistent YAML frontmatter format with `spec`, `phase`, `created` fields.

### Project-First Structure Analysis

**Current**: `specs/p283-claw-specum/` (centralized spec directory)
**Proposed**: `P283-claw-specum/spec/` (project-first, spec as subdirectory)

Implications:

| Concern | Current | Proposed | Impact |
|---------|---------|----------|--------|
| Git isolation | All specs in one dir | Each project could be its own repo | Positive |
| Antfarm `spec_dir` | Single path `~/claw-projects/specs` | Needs per-project resolution | Medium effort |
| Cross-spec references | `../other-spec/research.md` | Broken — different parent dirs | Negative |
| CLI discovery | Plugin scans `./specs/` | Plugin scans `./spec/` or configurable | Config change |
| Kiro compatibility | Different from `.kiro/specs/` | Closer to Kiro's per-project model | Positive |
| Existing tooling | 100+ specs in current format | Migration needed | High effort |

**Recommendation**: Support BOTH structures via configurable `specs_dirs` (ralph-specum already has this via `ralph_get_specs_dirs()`). Default to `./specs/` for backward compatibility, allow `P###/spec/` for new projects.

### Quality Commands

| Type | Command | Source |
|------|---------|--------|
| Lint | Not found | workspace has no linter |
| TypeCheck | Not found | workspace has no TS config |
| Unit Test | Not found | workspace has no test runner |
| Build | Not found | workspace has no build step |
| Test (all) | Not found | — |

**Note**: This is a plugin project. Quality commands will be defined in the plugin's own package.json during development. The workspace itself (`~/.openclaw/workspace`) is a config/memory repo with no code build pipeline.

**Local CI**: N/A for workspace. Plugin will need its own: `npm test` (smoke test for structure validation).

## Related Specs

| Spec | Relevance | Relationship | May Need Update |
|------|-----------|--------------|-----------------|
| p265-spec-kit-evaluation | High | Direct input — borrowings identified | No (research only) |
| p197-think-tank-plugin-v1-1-1 | High | Debate mode integration target | No |
| p138-antfarm-v2 | Medium | Antfarm workflow will consume plugin output | Yes — may need spec_dir config update |
| p281-antonic-skill-improvements | Low | Tangential skill ecosystem | No |
| p191-claw-projects-restructure | Medium | Project-first structure relates to restructuring goals | No |
| p245-executor-mcp-source-antfarm-agents | Medium | Executor agent pattern shared | No |

### Coordination Notes

- P138 (Antfarm v2): If claw-specum introduces project-first structure, Antfarm's `context.spec_dir` in workflow.yml needs to support per-project resolution
- P197 (Think Tank): No changes needed to think-tank itself; claw-specum invokes it as-is via `/think-tank:debate`

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|------------|-------|
| Technical Viability | **High** | Plugin architecture well-understood, ralph-specum proves the pattern works |
| Effort Estimate | **L** | ~40-60h. 8 agent prompts, 5 skills, 10+ commands, hooks, templates, schema, tests |
| Risk Level | **Medium** | Main risk: prompt engineering quality. Agents need tuning through A/B testing |

### Breakdown

| Component | Effort | Risk |
|-----------|--------|------|
| Plugin scaffold (plugin.json, dirs) | 2h | Low |
| Agent prompts (8 agents, original content) | 16-20h | High — prompt quality is everything |
| Skills (5 SKILL.md + references) | 8h | Medium |
| Commands (10+ slash commands) | 6h | Low |
| Hooks (stop-watcher, context-loader) | 4h | Medium — bash scripting for state machine |
| Templates (research, requirements, design, tasks, progress) | 3h | Low |
| Schema (state file, task format, frontmatter) | 2h | Low |
| Think-tank:debate integration | 4h | Medium — token cost management |
| Constitution phase | 2h | Low |
| Cross-CLI adapters (Codex, Gemini, Kiro context files) | 4h | Medium |
| Smoke tests | 3h | Low |

## Recommendations for Requirements

1. **Start with plugin scaffold + 4 core agents** (researcher, product-manager, architect, task-planner). Add executor, qa-engineer, plan-synthesizer, refactor-specialist in phase 2.

2. **Constitution phase as skill, not agent**. It loads `principles.md` + project constraints into `{{constitution_context}}`. Simple template expansion, no LLM call needed.

3. **Think-tank:debate integration should be opt-in** per phase. Default: debate requirements.md and design.md only. Flag: `--debate all|none|requirements,design`.

4. **Cross-CLI compatibility via "spec prompt pack"**: Generate per-CLI context files from spec artifacts. `claw-specum:export --format codex|gemini|kiro` command that produces the right context file.

5. **Keep project-first structure as OPTIONAL** via configurable `specs_dirs`. Don't force migration of 100+ existing specs. Support both `specs/p283-name/` and `P283-name/spec/`.

6. **Agent prompts must be original work**. Inspired by ralph-specum's structure and ideas, but all prompt text written from scratch. ralph-specum is MIT so structure reuse is fine, but we want differentiation for A/B testing.

7. **State file format should be compatible** with Antfarm's polling model. Use `.claw-state.json` (not `.ralph-state.json`) to avoid confusion.

8. **Hooks need the stop-watcher pattern** for autonomous execution loop. The Stop hook reads state, checks if more tasks remain, and re-invokes the executor. This is the core of autonomous execution.

9. **Artifact frontmatter should include a `cli_compat` field** indicating which CLIs can consume the artifact, enabling future tooling to filter/transform.

10. **The A/B comparison plan needs a rubric**. Define metrics upfront: time-to-complete, token cost, bug count in implementation, human intervention count, spec quality score. Without metrics, the A/B test is just vibes.

## Open Questions

1. **Where should the plugin live?** Options: `~/claw-projects/claw-specum/` (own repo, like think-tank) vs `~/ai-Projects/claw-specum/`. Recommend `~/claw-projects/` since it's a service project.

2. **Should the plugin publish to Claude Code marketplace?** If yes, needs public repo. If just for internal use, can stay private.

3. **Antfarm integration depth**: Should claw-specum artifacts be directly consumable by Antfarm workflows (replacing the current AGENTS.md-based agent prompts)? Or should Antfarm continue with its own agent prompts and just read spec artifacts?

4. **Token budget for think-tank:debate per phase**: At ~40K tokens per debate, full pipeline debate adds 80-160K tokens. Is this acceptable? Should we cap at 1 round for speed?

5. **Project-first structure migration timeline**: Is this a P283 deliverable or a future P?

## Sources

- [Claude Code plugin docs](https://code.claude.com/docs/en/plugins)
- [Claude Code skill best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Codex CLI AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)
- [Gemini CLI GEMINI.md docs](https://geminicli.com/docs/cli/gemini-md/)
- [Kiro IDE specs docs](https://kiro.dev/docs/specs/)
- [Kiro specs best practices](https://kiro.dev/docs/specs/best-practices/)
- [GitHub Spec-Kit repo](https://github.com/github/spec-kit)
- `/home/motobot/claw-projects/research/p265-spec-kit-vs-motobot-workflow.md`
- `/home/motobot/ai-Projects/smart-ralph-main/plugins/ralph-specum/` (full plugin tree)
- `/home/motobot/ai-Projects/think-tank/` (debate mode, orchestrator, prompts)
- `/home/motobot/claw-projects/antfarm/workflows/spec-dev/workflow.yml`
- `/home/motobot/claw-projects/antfarm/workflows/feature-dev/workflow.yml`
