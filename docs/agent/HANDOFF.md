# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-21 — **Hybrid UX (SDC-UX-001) implemented**

### Shipped

- **Lock model** — `src/features/interaction/` (`ManualLock`, `applyLocksToLayout`, `rerunLayoutWithLocks`).
- **Pipeline** — locks constrain layout + `manual-locked` LaneBook segments before routing; `runImport` / `routeConnections` accept locks.
- **Toolbar** — removed Auto/Manual toggle; **Reset to auto layout** + **Unlock all** always visible; lock count in hint.
- **Canvas** — cable / splice / fiber drag → snap → lock → rerun (horizontal); edge click or context menu **Lock strand lane**; right-click **Unlock selected** / **Unlock all**.
- **Validator** — `sdc-ux-001` registered.
- **Persistence** — `.sdc.json` v1 `manualLocks`; Export diagram config button writes JSON.

**Verify:** `npm run check`, `npm run test:ci`, `npm run build` green.

### Start next chat here

1. Manual QA: `?sample=sp3254` — drag cable, splice, fiber; confirm lock badges, reroute, Reset.
2. Resume grid/routing QA (reference CSVs, crossings).
3. Quad hybrid locks + center quadrants (SDC-GRID-001 gaps).

### Key files

- Spec: `docs/agent/rules/SDC-UX-001.md`
- Interaction: `src/features/interaction/`
- Canvas: `src/features/canvas/WorkflowCanvas.tsx`
- Import: `src/features/import/runImport.ts`, `parseSdcJson.ts`

---

## Earlier — Grid + routing rebuild (2026-06-21)

Horizontal-first grid engine, group lanes, LaneBook router, SDC-SCORE-001, route validators, tube trunk visual.

## Earlier sessions

Visual polish, CSV dedup fix, data foundation, rule pack adoption — see git history.
