# Import pipeline

> CSV + `.sdc.json` → connection graph → ELK layout → grid routing → React Flow canvas.

## Entry point

[`runImport()`](../../src/features/import/runImport.ts) — called from [`WorkflowCanvas`](../../src/features/canvas/WorkflowCanvas.tsx) on file import.

## Formats

| Format | Detection | Module |
|--------|-----------|--------|
| Bentley CSV | `.csv`, `Bentley Splice Report`, `Left ---` | `parseBentleyCsv.ts` |
| App export | `.sdc.json`, `.json` v1 | `parseSdcJson.ts` |

## CSV rules (Left section authoritative)

- One `<->` row = one splice pair
- Trailing/leading commas around `<->` are stripped
- Blank To fiber # → copy From; empty To device → copy From device
- To-side fixed tail: `fiber#`, tube, fiber color, device [, OS…]
- Right `---` is hints only — never paired
- Parse gap must be 0 before layout (`inspectBentleyCsv`)

## Pipeline

```
CSV / JSON
  → parse → ConnectionGraph (buildConnectionGraph)
  → classifyStrandGroups
  → runLayoutEngine (ELK + horizontal or quad)
  → routeConnections (LaneBook)
  → buildReactFlowGraph
  → canvas
```

## Modules

| Path | Role |
|------|------|
| `src/features/import/` | Parsers, inspect report, orchestrator |
| `src/features/diagram/` | ConnectionGraph, TIA order, strand groups, RF builder |
| `src/features/layout/` | Cable sides, ELK graph, horizontal + quad layout |
| `src/features/routing/` | Grid-snapped orthogonal routing |
| `src/features/grid/` | Pitch, zones, LaneBook |

## Inspect UI

Toolbar **Open connection inspector** → [`ParseInspectOverlay`](../../src/components/import/ParseInspectOverlay.tsx) with parse report.

## Reference tests

Contract counts in [`referenceCsvParse.test.ts`](../../src/features/import/referenceCsvParse.test.ts).
