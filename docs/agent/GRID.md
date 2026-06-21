# Grid — implementation notes

> Authoritative rule: [`rules/SDC-GRID-001.md`](./rules/SDC-GRID-001.md). Where the two disagree, the rule wins.

## Current code (2026-06-21)

| Item | Location / notes |
|------|------------------|
| Pitch | 24px — `constants.ts`, composed in `SDC_DEFAULTS` |
| Coords | `{ col, row }` ↔ px via `coords.ts` |
| `LaneBook` | Segment status: `occupied`, `blocked`, `manual-locked`, etc. (`laneBook.ts`, `segmentStatus.ts`) |
| Occupancy | `buildLayoutOccupancy()` — blocks cable cols + label bands before routing (`gridOccupancy.ts`) |
| Horizontal router | `horizontalRouter.ts` — books legs; emits `gridPoints` + `laneSegments` |
| Legacy helper | `routeOrthogonal.ts` — still used by quad path / late-bend detect |
| Zones | `zones.ts` (horizontal); debug overlay labels: leftSideZone / centerRoutingGrid / rightSideZone |
| Quad zones | `quadZones.ts` — edge bands; not rebuilt to new group-lane model |
| Debug | Shift+G or `?gridDebug=1` |

## Manual locks (SDC-UX-001)

- Hybrid mode: auto layout always runs; drags create **locks** (no Auto/Manual toggle).
- Code: `src/features/interaction/` (`manualLocks`, `applyLocksToLayout`, `rerunLayoutWithLocks`).
- Canvas: cable / splice / fiber drags → lock → partial rerun; context menu unlock; toolbar Reset / Unlock all.
- `LaneBook.tryReserve(..., "manual-locked")` seeded before routing when locks exist.
- Persistence: `.sdc.json` v1 `manualLocks` field; export via toolbar.
- Spec: [`rules/SDC-UX-001.md`](./rules/SDC-UX-001.md).

## Remaining vs SDC-GRID-001

- Center **quadrants** (four subdivisions of routing grid) — not implemented.
- Full `reserved` / `available` lifecycle on all segments.
- Quad mode on new lane model.
