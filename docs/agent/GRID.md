# Grid — implementation notes

> Authoritative rule: [`rules/SDC-GRID-001.md`](./rules/SDC-GRID-001.md). This file only records the **current code** so navigation stays easy during the grid rebuild. Where the two disagree, the rule wins.

The grid is the spatial source of truth for layout, routing, collision detection, and manual locks. See `SDC-GRID-001` for the target model (lanes, intersections, segment statuses `available/reserved/occupied/blocked/manual-locked`, center routing quadrants, side zones).

## Current code (may change during rebuild)

| Item | Value / location |
|------|------------------|
| `GRID_PITCH` | 24px (`src/features/grid/constants.ts`) |
| `TUBE_GROUP_GAP` | 8px |
| Coords | `{ col, row }` ints; `{ x, y }` px = `col * GRID_PITCH` (`coords.ts`) |
| Lane reservation | `LaneBook` (`laneBook.ts`) — vertical/horizontal tracks, conflict = same orientation + track + overlapping span |
| Horizontal zones | `leftCable / centerSplice / rightCable` (`zones.ts`) |
| Four-edge zones | `quadZones.ts` (`topCable / leftCable / rightCable / bottomCable / centerSplice`) |
| Orthogonal router | `routeOrthogonal.ts` (`routeHorizontalSpliceLeg`) |
| Debug overlay | Shift+G (localStorage `sdc-grid-debug`) or `?gridDebug=1` |

## Known gaps vs SDC-GRID-001 (see rules index "Open gaps")

- `SDC-GRID-001` does not fix a pitch value; code uses 24px. Pin pitch + spacing defaults in a future constants rule.
- Vocabulary: rename toward `Left/Right/Top/Bottom cable zone` + `Center routing grid`; reserve "quadrant" for the four center subdivisions (code's `quadZones` are the edge **side zones**, not center quadrants).
- Map `LaneBook` states onto the rule's segment-status model.
