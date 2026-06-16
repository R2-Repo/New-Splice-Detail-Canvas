# Agent docs — read order

> Only files in **this folder** (listed below) are active agent instructions.

## Active (read in order)

| File | Purpose |
|------|---------|
| [`REBUILD.md`](./REBUILD.md) | Shell status, what was kept vs removed |
| [`SCOPE.md`](./SCOPE.md) | High-level product vision (no implementation rules) |
| [`RULES_MODULAR.md`](./RULES_MODULAR.md) | Modular rules framework + per-rule workflow |
| [`rules/README.md`](./rules/README.md) | Index of active rule specs |
| [`CONTEXT.md`](./CONTEXT.md) | Current focus — update each session |
| [`HANDOFF.md`](./HANDOFF.md) | Last session summary |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder layout |
| [`IMPORT.md`](./IMPORT.md) | CSV + JSON import pipeline |
| [`CSV_SP-3254.5.md`](./CSV_SP-3254.5.md) | **Primary teaching CSV** — format + layout reference |
| [`GRID.md`](./GRID.md) | Grid coordinates, zones, lane book |
| [`SDC_JSON.md`](./SDC_JSON.md) | `.sdc.json` schema v1 |

Also: [`AGENTS.md`](../../AGENTS.md) and [`.cursor/rules/`](../../.cursor/rules/).

## Not active — do not follow

| Location | Why |
|----------|-----|
| [`docs/archive/`](../archive/) | Prior rules, layout IDs, routing spec, stabilization plans, CSV semantics, session history |
| [`docs/reference/routing-examples/`](../reference/routing-examples/) | Visual reference only — old R1–R7 routing rules are **not** requirements |
| Help modal content | Describes old app behavior — will be rewritten with rebuild |

When you add new rules, add specs under `docs/agent/rules/` and register in `src/features/rules/registry.ts`.
