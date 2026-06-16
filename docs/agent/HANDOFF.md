# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-15 — **SP-3254.5 layout oracles and optimization**

### What was done

- PDF oracle links in [`docs/reference/examples/README.md`](../reference/examples/README.md) and [`CSV_SP-3254.5.md`](./CSV_SP-3254.5.md).
- Terminating Device ignored — structural parse only; not on graph types.
- [`scoreRouting.ts`](../../src/features/routing/scoreRouting.ts) — crossings, loop-backs, bends, route-error penalty.
- [`pickBestLayout`](../../src/features/rules/placement/pickBestLayout.ts) — tries placement candidates, picks lowest score; wired into `runImport()`.
- SP-3254.5 candidates: default, mirror-sides, swap-144-left, drop-from-right.
- [`sp3254-placement.md`](./rules/sp3254-placement.md) — placement rule scaffold for user refinement.
- Tests: `scoreRouting.test.ts`, `sp3254Optimization.test.ts` (55 tests total).

### Auto scores (SP-3254.5)

| Mode | Plan | Score |
|------|------|-------|
| Horizontal | `mirror-sides` | 2024 |
| Quad | — | >200000 (20 route errors — routing not ready) |

### Next session

- User reviews PDF oracles → refine `generateSp3254Candidates()` per [`sp3254-placement.md`](./rules/sp3254-placement.md).
- Fix quad routing so quad vs horizontal comparison is meaningful.
- Fill oracle variant annotation table in `CSV_SP-3254.5.md` after visual QA.
