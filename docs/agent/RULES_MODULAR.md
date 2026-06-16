# Modular rules (planned)

> **Status:** Direction agreed — no rule modules in repo yet. User will provide modules later.

## Why this rebuild differs

Prior attempts used **one monolithic rules document** to govern:

- How splice detail was added to the canvas
- How fiber cables, buffer tubes, and fiber strands were routed and connected

That was hard to maintain, follow, validate, and test.

This rebuild **modularizes everything**, including rules. Each rule is an individual module — easier to maintain, compose, validate, and test in isolation.

## Prior art (not active)

Archived monolith and engines: `docs/archive/` (`LAYOUT_RULES.md`, rule dictionaries, `layoutRules.ts`, routing engines, etc.). **Do not re-integrate as a single doc.**

## Target shape (when modules arrive)

Each rule module should define:

| Concern | Notes |
|---------|--------|
| **Scope** | What it governs (placement, tube order, routing, connections, …) |
| **Inputs** | Graph or layout state it reads |
| **Outputs** | State it writes or constraints it emits |
| **Order** | Where it runs relative to other modules in the pipeline |
| **Tests** | Unit/contract tests for that module only |

Likely code home: `src/features/diagram/rules/` (or subfolders under layout/routing). Human-readable specs may live alongside in `docs/agent/` if needed.

## Pipeline (target)

```
Bentley CSV
  → parse → connection graph
  → layout rule modules → node positions
  → routing rule modules → edge paths
  → React Flow canvas
```

Orchestration (how modules compose) will be designed when the first modules land.

## Agent workflow

1. Wait for user-provided rule modules — do not invent rules from `docs/archive/`.
2. Implement each module as a discrete unit with its own tests.
3. Wire composition into layout → route stages per `ARCHITECTURE.md`.
4. List new active rule docs in [`README.md`](./README.md).

## Next step

User to supply a handful of rule modules. Stand by for further instructions.
