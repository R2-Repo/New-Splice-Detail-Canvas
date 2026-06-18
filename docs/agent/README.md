# Agent docs — read order

> Only files in **this folder** (listed below) are active agent instructions.

## Active (read in order)

| File | Purpose |
|------|---------|
| [`REBUILD.md`](./REBUILD.md) | Shell status, what was kept vs rebuilt |
| [`SCOPE.md`](./SCOPE.md) | High-level product vision (no implementation rules) |
| [`rules/README.md`](./rules/README.md) | **SDC rule pack index** — canonical specs, processing order, conflict priority |
| [`RULES_MODULAR.md`](./RULES_MODULAR.md) | How rules become code modules + per-rule workflow |
| [`CONTEXT.md`](./CONTEXT.md) | Current focus — update each session |
| [`HANDOFF.md`](./HANDOFF.md) | Last session summary |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder layout |
| [`IMPORT.md`](./IMPORT.md) | Import implementation notes (rule: `SDC-IMPORT-001`) |
| [`GRID.md`](./GRID.md) | Grid implementation notes (rule: `SDC-GRID-001`) |
| [`SDC_JSON.md`](./SDC_JSON.md) | `.sdc.json` v1 — superseded by `SDC-EXPORT-001` |

The **SDC rule pack** ([`rules/`](./rules/)) is the source of truth for behavior. Rule pack version: `SDC-RULES-2026-06`. Big-ticket rebuild areas: import (`SDC-IMPORT-001`), routing (`SDC-ROUTE-001..004`, `SDC-SCORE-001`), grid (`SDC-GRID-001`).

Also: [`AGENTS.md`](../../AGENTS.md) and [`.cursor/rules/`](../../.cursor/rules/).

## Reference (not requirements)

| Location | Why |
|----------|-----|
| [`docs/reference/examples/`](../reference/examples/) | Bentley CSV + PDF examples for import/layout QA |
| [`docs/reference/routing-examples/`](../reference/routing-examples/) | Prior-app routing screenshots — visual reference only |
| Help modal content | Describes old app behavior — will be rewritten with rebuild |

When you add a rule: add a spec under [`rules/`](./rules/), register it in [`rules/README.md`](./rules/README.md), and implement the module in `src/features/rules/` (see [`RULES_MODULAR.md`](./RULES_MODULAR.md)).
