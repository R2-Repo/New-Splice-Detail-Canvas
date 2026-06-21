# Context

> Agents: keep this file current-only.

## Phase

**Paused — grid/routing (horizontal) landed; deeper testing deferred.** User smoke-tested SP-3254 (`?sample=sp3254`); nothing obviously wrong. **Next chat priority: auto + manual adjustment modes ([`SDC-UX-001`](./rules/SDC-UX-001.md))** — needed before rigorous layout/routing QA.

## Baseline (2026-06-21)

| Item | Status |
|------|--------|
| Import + data | Normalized model + validators (`sdc-import/data/connect-001`) |
| Grid + routing (horizontal) | `LaneBook` + `buildLayoutOccupancy`; `horizontalRouter.ts`; `groupLanes` / `connectionMidCols` / `fanoutExits`; validators `sdc-grid-001`, `sdc-route-001..004` |
| Scoring | `scoreRouting.ts` (SDC-SCORE-001); `pickBestLayout` + expanded candidates |
| Visual | Tube trunk + strand fans; oracle-style labels/title (prior sessions) |
| **Interaction** | **Not rebuilt** — toolbar Auto/Manual toggle shell only; CSS hooks in `splice-diagram.css`; no lock model wired to grid/router |
| Quality | `npm run verify` green (108 tests) last session |

## In scope NOW (next chat)

- **SDC-UX-001:** auto layout always on; manual drags → locked overrides on grid; retry/re-import respects locks; unlock/reset flows.
- Reconcile toolbar **Auto adjust / Manual adjust** with rule spec (locks, not a mode that disables auto).
- Wire `manual-locked` segments into `LaneBook` + `routeConnections` when locks exist.

## Paused (revisit after UX)

- Deeper grid/routing regression + reference CSV matrix.
- Quad/4-side on new grid model.
- Score/plan breakdown in validation UI.
- Oracle side assignment (e.g. 72-SMF orientation).

## Known gaps

- Quad: legacy ELK + old quad router.
- `.sdc.json` v1 vs `DiagramConfig` ([`SDC-EXPORT-001`](./rules/SDC-EXPORT-001.md)).
- `tiaColors` vs SDC-ORDER abbreviations.
- Browser: do not import `@/features/rules` barrel (use `validateImport`, `types` directly).

## Out of scope

- Neumorphic theme / toolbar chrome changes without user approval.

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`rules/README.md`](./rules/README.md)
3. [`HANDOFF.md`](./HANDOFF.md)
