# `.sdc.json` export/import schema (v1)

Minimal schema for round-tripping diagram state.

## Version

`version: 1` — required.

## Required fields

| Field | Type | Notes |
|-------|------|-------|
| `version` | `1` | Schema version |
| `spliceName` | string | Splice identifier |
| `layoutMode` | `"horizontal"` \| `"quad"` | Active layout |

## Optional fields

| Field | Type | Notes |
|-------|------|-------|
| `sourceCsv` | string | Embedded Bentley CSV text |
| `sourceFileName` | string | Original CSV filename |
| `connectionGraph` | object | Serialized `ConnectionGraph` |
| `layoutOverrides` | object | Callouts, toggles, etc. |
| `nodePositions` | `Record<string, {x,y}>` | Pixel positions keyed by node id |

## Import behavior

1. If `connectionGraph` present → use directly
2. Else if `sourceCsv` present → parse CSV → graph
3. Apply `nodePositions` over auto layout when provided
4. `layoutMode` selects horizontal vs quad engine

## Code

- Parse: [`parseSdcJson.ts`](../../src/features/import/parseSdcJson.ts)
- Serialize: `serializeSdcJson()` (export button TBD)

## Example

```json
{
  "version": 1,
  "spliceName": "STATE_OFFICE",
  "layoutMode": "horizontal",
  "sourceCsv": "Bentley Splice Report\n...",
  "nodePositions": {
    "cable-288-SMF#from": { "x": 96, "y": 192 }
  }
}
```
