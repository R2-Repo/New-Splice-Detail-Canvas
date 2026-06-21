# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-21 — **Session end: grid/routing paused; UX modes next**

### Shipped this epic (grid + routing, horizontal first)

All six plan phases completed in code + tests:

| Phase | Deliverable |
|-------|-------------|
| 1 | `LaneBook` + `GridSegmentStatus`; `buildLayoutOccupancy()`; expanded `sdc-grid-001` |
| 2 | `groupLanes`, `connectionMidCols`, `fanoutExits` in `computeHorizontalLayout`; `sdc-route-002` |
| 3 | `horizontalRouter.ts` → `routeConnections` (LaneBook-backed, structured route metadata) |
| 4 | SDC-SCORE-001 in `scoreRouting.ts`; `pickBestLayout` + candidate expansion |
| 5 | `sdc-route-001`, `sdc-route-003`, `sdc-route-004` registered |
| 6 | Thick tube trunk + thin strand fans (`FanoutEdge`, `buildReactFlowGraph`) |

**Verify:** `npm run verify` green (108 tests). **Smoke test:** user reports SP-3254 looks OK; no deep QA yet.

**Dev loop:** `npm run dev` → `http://localhost:5173/?sample=sp3254` · `?gridDebug=1` for booked lanes.

### User decision

Stop here for now. Implement **automatic + manual adjustment modes** ([`SDC-UX-001`](./rules/SDC-UX-001.md)) in the **next chat** before more grid/routing testing.

### Start next chat here

1. Read [`SDC-UX-001.md`](./rules/SDC-UX-001.md) and [`CONTEXT.md`](./CONTEXT.md).
2. **Existing UI shell:** `WorkflowCanvas.tsx` — segmented **Auto adjust / Manual adjust** (`autoAdjustEnabled`); Manual only adds **Reset to auto layout** (re-import). CSS for manual handles/guides in `splice-diagram.css` — not wired to new router.
3. **Rule vs UI:** Spec says auto layout always runs; manual edits become **locked overrides** (`manual-locked` on grid), not a toggle that turns auto off. Plan reconciliation with user.
4. **Grid hooks ready:** `LaneBook.tryReserve(..., "manual-locked")`, `buildLayoutOccupancy`, `horizontalRouter` booking — locks not persisted or applied yet.
5. **After UX:** resume grid QA (reference CSVs, crossings, quad), score UI, oracle side tuning.

### Key files for UX work

- Spec: `docs/agent/rules/SDC-UX-001.md`
- Canvas: `src/features/canvas/WorkflowCanvas.tsx`
- Grid: `src/features/grid/laneBook.ts`, `gridOccupancy.ts`
- Layout/routing: `runImport.ts`, `pickBestLayout.ts`, `routeConnections.ts`
- Export target: `SDC-EXPORT-001` (`DiagramConfig.manualLocks`)

---

## Earlier — Grid + routing rebuild (2026-06-21)

Implemented horizontal-first grid engine, group lanes, LaneBook router, SDC-SCORE-001, route validators, tube trunk visual. See git history for file-level detail.

## Earlier sessions

Visual polish, CSV dedup fix, data foundation, rule pack adoption — see git history.
