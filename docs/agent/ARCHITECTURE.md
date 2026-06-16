# Architecture

## Layout (rebuild)

```
src/
  components/
    import/          # CsvImportButton, ParseInspectOverlay
  features/
    import/          # CSV + JSON parsers, runImport orchestrator
    diagram/         # ConnectionGraph, strand groups, buildReactFlowGraph
    layout/          # ELK, horizontal + quad placement
    routing/         # LaneBook routing after layout
    rules/           # Modular rule modules + system suite (see RULES_MODULAR.md)
    grid/            # Pitch, zones, quad zones, LaneBook, router
    canvas/          # WorkflowCanvas, node/edge types
docs/agent/          # REBUILD, IMPORT, GRID, SDC_JSON, …
docs/reference/      # CSV examples, images
```

## Data flow

```
CSV / .sdc.json
  → detectImportFormat → parse
  → buildConnectionGraph
  → classifyStrandGroups
  → runLayoutEngine (ELK + horizontal | quad)
  → routeConnections (LaneBook, grid snap)
  → buildReactFlowGraph
  → WorkflowCanvas
```

## Module map

| Module | Key exports |
|--------|-------------|
| `import/` | `runImport`, `parseBentleyCsv`, `inspectBentleyCsv`, `parseSdcJson` |
| `diagram/` | `buildConnectionGraph`, `classifyStrandGroups`, `buildReactFlowGraph` |
| `layout/` | `runLayoutEngine`, `assignCableSides`, ELK builders |
| `routing/` | `routeConnections`, `routeQuadSpliceLeg` |
| `rules/` | `runRules`, `buildSnapshotFromExample`, `RULE_REGISTRY` |
| `grid/` | `GRID_PITCH`, zones, `LaneBook`, `routeHorizontalSpliceLeg` |

Rules remain **modular** — see [`RULES_MODULAR.md`](./RULES_MODULAR.md).

## Quality gates

`npm run check` → `npm run test:ci` → `npm run build`

Import contract tests: `src/features/import/referenceCsvParse.test.ts`

Rule tests: `npm run test:rules` (see [`RULES_MODULAR.md`](./RULES_MODULAR.md))
