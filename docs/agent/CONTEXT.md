# Context

> Agents: keep this file current-only.

## Phase

**Import module + automatic layout shipped.** CSV parser, ELK layout (horizontal + quad), grid routing, canvas integration.

## Baseline (2026-06-16)

| Item | Status |
|------|--------|
| `npm run verify` | check + test:ci + build green |
| `src/features/import/` | Bentley CSV parser, `.sdc.json`, `runImport()` |
| `src/features/diagram/` | ConnectionGraph, strand groups, React Flow builder |
| `src/features/layout/` | ELK (`elkjs`), horizontal + quad placement |
| `src/features/routing/` | LaneBook group routing, quad legs |
| Canvas | Import → full diagram; layout mode toggle re-runs pipeline |
| Inspect | Parse report overlay on toolbar inspect button |

## In scope NOW

- User-defined layout/routing rule modules (`RULES_MODULAR.md`)
- Layout quality tuning against reference PNGs
- Export `.sdc.json` button (import path done)

## Out of scope

- Changing neumorphic theme or toolbar chrome without user approval

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`SCOPE.md`](./SCOPE.md)
3. [`IMPORT.md`](./IMPORT.md)
4. [`GRID.md`](./GRID.md)
5. [`SDC_JSON.md`](./SDC_JSON.md)
6. [`HANDOFF.md`](./HANDOFF.md)
