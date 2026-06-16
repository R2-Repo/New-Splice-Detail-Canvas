# Context

> Agents: keep this file current-only.

## Phase

**SP-3254.5 layout oracles + route scorer.** PDF variants documented; placement optimizer picks lowest score.

## Baseline (2026-06-15)

| Item | Status |
|------|--------|
| `npm run verify` | check + test:ci + build green |
| `src/features/import/` | Bentley CSV parser, `.sdc.json`, `runImport()` with `optimizeLayout` |
| `src/features/diagram/` | ConnectionGraph, strand groups, React Flow builder |
| `src/features/layout/` | ELK, horizontal + quad; accepts `PlacementPlan` |
| `src/features/routing/` | LaneBook routing, `scoreRouting()` |
| `src/features/rules/placement/` | Candidate generation, `pickBestLayout()` |
| Teaching CSV | [`CSV_SP-3254.5.md`](./CSV_SP-3254.5.md) — PDF oracles, auto scores, device ignored |
| Placement scaffold | [`rules/sp3254-placement.md`](./rules/sp3254-placement.md) — awaiting user refinement |

## In scope NOW

- **Refine placement rules** from PDF oracle review (side/stack order)
- Quad routing fix so quad score comparison is meaningful

## Out of scope

- Changing neumorphic theme or toolbar chrome without user approval

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`SCOPE.md`](./SCOPE.md)
3. [`RULES_MODULAR.md`](./RULES_MODULAR.md)
4. [`IMPORT.md`](./IMPORT.md)
5. [`GRID.md`](./GRID.md)
6. [`SDC_JSON.md`](./SDC_JSON.md)
7. [`HANDOFF.md`](./HANDOFF.md)
