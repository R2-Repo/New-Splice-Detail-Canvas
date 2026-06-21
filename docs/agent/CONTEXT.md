# Context

> Agents: keep this file current-only.

## Phase

**Hybrid UX (SDC-UX-001) landed.** Grid/routing horizontal baseline + lock-based manual adjustment. Next: deeper grid/routing QA, quad on new grid model.

## Baseline (2026-06-21)

| Item | Status |
|------|--------|
| Import + data | Normalized model + validators (`sdc-import/data/connect-001`) |
| Grid + routing (horizontal) | `LaneBook`, `horizontalRouter`, route validators, scoring |
| **Interaction** | **Hybrid mode** — locks not modes; drag → lock → rerun; Reset / Unlock all; `.sdc.json` `manualLocks`; `sdc-ux-001` validator |
| Visual | Tube trunk + strand fans; oracle-style labels/title |
| Quality | `npm run verify` green (112+ tests) |

## In scope NOW

- Deeper grid/routing regression + reference CSV matrix (post-UX).
- Quad/4-side on new grid model + hybrid locks for quad.

## Paused / deferred

- Full `DiagramConfig` / PDF export (SDC-EXPORT-001).
- Bundle marquee multi-select locks.
- Undo/redo.

## Known gaps

- Quad: legacy ELK + old quad router; hybrid UX horizontal-only for drags.
- Browser: do not import `@/features/rules` barrel (use `validateImport`, `types` directly).

## Out of scope

- Neumorphic theme / toolbar chrome changes without user approval.

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`rules/README.md`](./rules/README.md)
3. [`HANDOFF.md`](./HANDOFF.md)
