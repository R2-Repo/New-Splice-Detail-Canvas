# Agent docs — read order

> Only files in **this folder** (listed below) are active agent instructions.

## Active (read in order)

| File | Purpose |
|------|---------|
| [`REBUILD.md`](./REBUILD.md) | Shell status, what was kept vs removed |
| [`SCOPE.md`](./SCOPE.md) | High-level product vision (no implementation rules) |
| [`CONTEXT.md`](./CONTEXT.md) | Current focus — update each session |
| [`HANDOFF.md`](./HANDOFF.md) | Last session summary |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Folder layout |

Also: [`AGENTS.md`](../../AGENTS.md) and [`.cursor/rules/`](../../.cursor/rules/).

## Not active — do not follow

| Location | Why |
|----------|-----|
| [`docs/archive/`](../archive/) | Prior rules, layout IDs, routing spec, stabilization plans, CSV semantics, session history |
| [`docs/reference/routing-examples/`](../reference/routing-examples/) | Visual reference only — old R1–R7 routing rules are **not** requirements |
| Help modal content | Describes old app behavior — will be rewritten with rebuild |

When you add new rules, put them in `docs/agent/` (or new `.cursor/rules/` files) and list them here.
