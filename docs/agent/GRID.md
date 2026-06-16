# Grid coordinate system

> Active foundation for layout, routing, and import placement. Archive [`LAYOUT_RULES.md`](../archive/LAYOUT_RULES.md) is reference only.

## Purpose

Splice diagrams use a **logical grid** so fiber rows, routing lanes, and fusion dots align consistently. The grid gives:

- Fixed pitch for placement and snap
- Named zones for discussion and debugging
- Lane reservation to prevent strand collisions

React Flow's `<Background>` dots are **visual only**. All layout math lives in `src/features/grid/`.

## Constants

| Constant | Value | Role |
|----------|-------|------|
| `GRID_PITCH` | 24px | Fiber row spacing, lane separation |
| `TUBE_GROUP_GAP` | 8px | Gap between buffer tube groups |

Source: [`src/features/grid/constants.ts`](../../src/features/grid/constants.ts)

## Coordinates

- **Grid point:** `{ col, row }` — integer cell indices
- **Pixel point:** `{ x, y }` — React Flow canvas coords (`col * GRID_PITCH`)

Helpers: `snapToGrid`, `gridToPx`, `pxToGrid`, `gridPoint`, `gridPointToPixel`

## Zones (horizontal layout)

Three column ranges left → right:

| Zone ID | Contents |
|---------|----------|
| `leftCable` | Source cables, buffer tubes, fiber handles |
| `centerSplice` | midX vertical lanes, fusion dots, splice legs |
| `rightCable` | Target cables (mirror of left) |

Default demo bounds (`DEFAULT_DEMO_ZONE_LAYOUT`):

- left: cols 0–12
- center: cols 13–28
- right: cols 29+

Use `zoneAtColumn(col, layout)` to classify a column.

## Lane reservation

`LaneBook` tracks booked segments on grid tracks:

- **Vertical lane:** `track` = column, span = row range
- **Horizontal track:** `track` = row, span = column range

Two segments conflict when they share orientation + track + overlapping span.

Routing (`routeHorizontalSpliceLeg`) books:

1. Source horizontal leg → midX column
2. Vertical midX leg through center zone
3. Target horizontal leg from midX → target handle

## Zones (quad layout)

Four edge bands + center routing field — see [`quadZones.ts`](../../src/features/grid/quadZones.ts):

| Zone ID | Contents |
|---------|----------|
| `topCable` / `bottomCable` | Cables on top/bottom |
| `leftCable` / `rightCable` | Cables on sides |
| `centerSplice` | Fusion dots and orthogonal legs |

Helpers: `defaultQuadZoneLayout`, `zoneAtQuadColumnRow`, `isInQuadCenter`

## Import → grid pipeline

See [`IMPORT.md`](./IMPORT.md). Summary:

```
CSV → ConnectionGraph → ELK layout → GridNodePlacement[] → routeConnections → canvas
```

`demoPlacementsFromImport()` / `buildDemoGridGraph()` remain for unit tests only.

## Debug overlay

- **Shift+G** toggles overlay (persisted in `localStorage` key `sdc-grid-debug`)
- **`?gridDebug=1`** enables on load

Shows zone boundaries, column labels, and booked lanes.

## Module map

| File | Role |
|------|------|
| `constants.ts` | Pitch and gaps |
| `coords.ts` | Grid ↔ pixel conversion |
| `zones.ts` | Zone layout types |
| `laneBook.ts` | Lane reservation |
| `routeOrthogonal.ts` | Horizontal splice leg router |
| `quadZones.ts` | Quad zone layout |
| `placement.ts` | Placement types + demo stub |
| `demoGraph.ts` | Demo graph for grid tests |

## Related archive rules (reference)

When writing active routing rules, see archive EDGE-010–012 (lane separation, midX), FBR-002 (24px pitch), DOT-002 (fusion dot columns).
