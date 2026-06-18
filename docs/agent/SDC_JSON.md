# `.sdc.json` v1 — superseded

> **Superseded by [`rules/SDC-EXPORT-001.md`](./rules/SDC-EXPORT-001.md).** The target persistence format is `DiagramConfig` (schemaVersion, rulePackVersion, normalizedImportModel, manualLocks, routeGeometry, validationResults, ...). This file documents the **current minimal v1** that the code still emits; provide a v1 → DiagramConfig migration during the export rebuild.

## Current v1 (code)

Parse: [`parseSdcJson.ts`](../../src/features/import/parseSdcJson.ts). Serialize: `serializeSdcJson()` (export button TBD).

Required: `version: 1`, `spliceName` (string), `layoutMode` (`"horizontal" | "quad"`).

Optional: `sourceCsv`, `sourceFileName`, `connectionGraph`, `layoutOverrides`, `nodePositions` (`Record<string,{x,y}>`).

Import behavior: use `connectionGraph` if present, else parse `sourceCsv`; apply `nodePositions` over auto layout; `layoutMode` selects the engine.

```json
{
  "version": 1,
  "spliceName": "STATE_OFFICE",
  "layoutMode": "horizontal",
  "sourceCsv": "Bentley Splice Report\n...",
  "nodePositions": { "cable-288-SMF#from": { "x": 96, "y": 192 } }
}
```
