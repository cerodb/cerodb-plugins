---
name: think-tank
description: "Multi-agent collaboration: debate, review, brainstorm, hypothesis, cross-agent, and help modes for higher-quality analysis"
metadata: {"openclaw":{"requires":{"bins":["node"]},"emoji":"🧠"}}
---

# Think Tank

Think Tank runs multiple Claude instances in structured roles to produce higher-quality analysis than any single pass. Wrapper skill — delegates to the locally-installed Think Tank plugin.

## Requirements

- Think Tank plugin installed locally (see `INSTALL.md`)
- `node` v22+ on PATH
- `THINK_TANK_DIR` env var set, or plugin at the default path `$HOME/ai-Projects/think-tank/plugins/think-tank`

## Modes

### debate

Adversarial document improvement. A CRITIC attacks the document across 6 mandatory vectors, a DEFENDER responds and concedes what's valid, and after N rounds a SYNTHESIZER produces an improved version. A DIFF EVALUATOR checks for regressions.

**Best for:** specs, architecture docs, proposals, research reports.

**Usage:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" debate path/to/doc.md
```

With options:

```bash
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" debate path/to/doc.md --rounds 3 --output-dir ./adversarial
```

Outputs: `adversarial/improved-<doc>.md`, `adversarial/debate-log.md`, `adversarial/diff-eval.md`

---

### review

Multi-reviewer code review. Three specialists analyze code independently: BUG HUNTER (logic errors, edge cases), SECURITY AUDITOR (injection, auth bypass, data exposure), PERFORMANCE ANALYST (leaks, blocking calls, caching). A SYNTHESIZER merges findings into a prioritized action list (Critical/High/Medium/Low).

**Best for:** source code, scripts, configuration files.

**Usage:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" review path/to/file.js
```

With options:

```bash
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" review path/to/file.js --output-dir ./review-output --model sonnet
```

Outputs: `review-YYYY-MM-DD-HHmmss.md` with prioritized findings.

---

### brainstorm

Diverge-challenge-synthesize ideation. A DIVERGER generates 5+ ideas with implementation sketches, a CHALLENGER stress-tests each idea (hidden assumptions, failure modes, better alternatives), and a SYNTHESIZER ranks the top 3 with pros/cons and a final recommendation. Accepts a topic string or file path.

**Best for:** design decisions, feature planning, strategic choices.

**Usage — topic string:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" brainstorm "API design for auth service"
```

**Usage — file context:**

```bash
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" brainstorm path/to/context.md --output-dir ./ideas
```

---

### hypothesis

Hypothesis-driven research with git branching. A RESEARCHER explores the codebase on a dedicated git branch gathering evidence, a VERIFIER independently validates the researcher's claims on a separate branch, and a REPORT synthesizes findings into a confirm/reject/pivot recommendation with evidence.

**Best for:** codebase investigation, bug hunting, architecture analysis.

**Setup:** create a `hypothesis.md` file in the current directory (template at `$THINK_TANK_DIR/hypothesis-template.md`).

**Usage:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" hypothesis
```

With a specific file:

```bash
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" hypothesis --file my-hypothesis.md --cycles 2
```

---

### cross-agent

Consult Codex and/or Claude side-by-side with optional arbiter synthesis. Delegates a question to one or both CLI agents and returns their responses. With `--arbiter`, adds a synthesis pass that merges and weighs both answers.

**Best for:** second opinions, cross-validation of decisions, leveraging different model strengths.

**Usage — ask Codex:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" cross-agent --topic "Is this migration safe?" --target codex
```

**Usage — ask both with arbiter:**

```bash
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" cross-agent --topic "Best approach for rate limiting?" --target both --arbiter
```

**Safety defaults:** Codex runs `--sandbox read-only`; Claude runs with `--no-session-persistence` and defaults to `--max-budget-usd 0.50`.

---

### help

Show all Think Tank modes and usage summary.

**Usage:**

```bash
THINK_TANK_DIR="${THINK_TANK_DIR:-$HOME/ai-Projects/think-tank/plugins/think-tank}"
node "$THINK_TANK_DIR/scripts/orchestrator.mjs" help
```

Or via the plugin bin:

```bash
"$THINK_TANK_DIR/../../bin/think-tank" help
```

---

## Common Options

| Option | Description |
|--------|-------------|
| `--model MODEL` | Override the Claude model (e.g., `sonnet`, `opus`, `haiku`) |
| `--output-dir DIR` | Where to save output files (default: alongside input file) |
| `--rounds N` | Number of debate rounds (debate mode, default: 2) |
| `--cycles N` | Number of research cycles (hypothesis mode, default: 1) |
| `--max-budget-usd N` | Cost cap per run (cross-agent mode, default: 0.50) |
