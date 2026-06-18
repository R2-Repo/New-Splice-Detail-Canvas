# Import — implementation notes

> Authoritative rule: [`rules/SDC-IMPORT-001.md`](./rules/SDC-IMPORT-001.md) (includes the Bentley Splice Report appendix). This file only records the **current code** so navigation stays easy during the import rebuild. Where the two disagree, the rule wins.

## Current pipeline

```
CSV / .sdc.json
  → detectImportFormat → parse (parseBentleyCsv | parseSdcJson)
  → buildConnectionGraph
  → classifyStrandGroups
  → pickBestLayout (placement candidates + route score) OR runLayoutEngine
  → routeConnections (LaneBook)
  → buildReactFlowGraph
  → canvas
```

Entry point: [`runImport()`](../../src/features/import/runImport.ts), called from `WorkflowCanvas` on file import. `optimizeLayout` defaults to `true`.

## Current modules

| Path | Role |
|------|------|
| `src/features/import/` | Parsers, `inspectBentleyCsv`, orchestrator |
| `src/features/diagram/` | ConnectionGraph, TIA order, strand groups, RF builder |
| `src/features/layout/` | Cable sides, ELK graph, horizontal + quad layout |
| `src/features/routing/` | LaneBook routing, route quality scorer |
| `src/features/rules/placement/` | Placement candidates, `pickBestLayout` |
| `src/features/grid/` | Pitch, zones, LaneBook |

Inspect UI: toolbar **Open connection inspector** → `ParseInspectOverlay`. Contract counts: `referenceCsvParse.test.ts`.

## Reference data

Bentley CSV + PDF examples: [`docs/reference/examples/`](../reference/examples/) (includes `Left-SP-3254.5.csv` and the prior-app horizontal PDF oracles).

## Known gaps vs SDC-IMPORT-001 (see rules index "Open gaps")

- Current parser predates the generic normalized-model contract (`NormalizedImport`, confidence levels, configurable header alias map). The Bentley-specific behaviors it implements are captured in the `SDC-IMPORT-001` Bentley appendix.
- Placement/scoring code (`rules/placement/`, `scoreRouting.ts`) is the **old SP-3254 oracle approach**; it is superseded by `SDC-LAYOUT-003` + `SDC-SCORE-001` and will be reconciled in the routing rebuild. The matching tests (`sp3254Teaching.test.ts`, `sp3254Optimization.test.ts`) still exist in code.
