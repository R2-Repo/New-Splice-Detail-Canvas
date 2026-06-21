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

## Manual locks (not wired yet)

- Vocabulary and `LaneBook` API support `manual-locked`.
- No drag → lock → re-route loop yet ([`SDC-UX-001`](./rules/SDC-UX-001.md)).
- Next: persist locks, mark grid segments, reroute unlocked strands around them.

## Remaining vs SDC-GRID-001

- Center **quadrants** (four subdivisions of routing grid) — not implemented.
- Full `reserved` / `available` lifecycle on all segments.
- Quad mode on new lane model.
