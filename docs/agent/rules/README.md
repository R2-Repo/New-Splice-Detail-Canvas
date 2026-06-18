# SDC Rule Index

Canonical rule specs for Splice Detail Canvas. Rule pack version: `SDC-RULES-2026-06`.

Each rule has its own file: `docs/agent/rules/SDC-<GROUP>-<NUMBER>.md`. This index is the single source of truth for the rule list, processing order, conflict priority, and the related-rule matrix. The big-ticket rebuild areas are **import** (`SDC-IMPORT-001`), **routing** (`SDC-ROUTE-001..004`, `SDC-SCORE-001`), and the **grid** (`SDC-GRID-001`).

## Rule ID system

`SDC-<GROUP>-<NUMBER>`

- `SDC` = Splice Detail Canvas.
- `GROUP` = rule family.
- `NUMBER` = stable sequence number within that family.

Groups:
- `CORE` = shared vocabulary and diagram structure.
- `CONST` = shared numeric defaults (pitch, spacing, dot, stroke).
- `IMPORT` = CSV parsing and normalization.
- `DATA` = imported cable data model and validation.
- `ORDER` = color-code ordering rules.
- `CONNECT` = connection pairing and fusion splice dots.
- `GRID` = internal canvas grid and lane reservation.
- `LAYOUT` = visual placement, fanout, labels, spacing, side assignment.
- `ROUTE` = routing zones, nesting, crossings, collisions, path geometry.
- `LABEL` = label placement and text collision.
- `SCORE` = layout scoring and retry.
- `VALIDATE` = validation message standard.
- `EXPORT` = persistence, config, PDF export, reimport.
- `VISUAL` = rendered colors, layers, legend.
- `UX` = manual adjustment, locks, resets, interaction.

## Active rules

| Rule ID | Title | Spec |
|---|---|---|
| SDC-CORE-001 | Glossary and Diagram Structure | [SDC-CORE-001.md](./SDC-CORE-001.md) |
| SDC-CONST-001 | Layout Constants and Defaults | [SDC-CONST-001.md](./SDC-CONST-001.md) |
| SDC-IMPORT-001 | CSV Import, Normalization, and Bentley Compatibility | [SDC-IMPORT-001.md](./SDC-IMPORT-001.md) |
| SDC-DATA-001 | Fiber Optic Cable Hierarchy | [SDC-DATA-001.md](./SDC-DATA-001.md) |
| SDC-DATA-002 | Buffer Tube Count | [SDC-DATA-002.md](./SDC-DATA-002.md) |
| SDC-ORDER-001 | Buffer Tube Color Order | [SDC-ORDER-001.md](./SDC-ORDER-001.md) |
| SDC-ORDER-002 | Fiber Strand Color Order | [SDC-ORDER-002.md](./SDC-ORDER-002.md) |
| SDC-CONNECT-001 | Fusion Splice Dot and Connection Pairing | [SDC-CONNECT-001.md](./SDC-CONNECT-001.md) |
| SDC-GRID-001 | Canvas Grid System | [SDC-GRID-001.md](./SDC-GRID-001.md) |
| SDC-LAYOUT-001 | Spacing | [SDC-LAYOUT-001.md](./SDC-LAYOUT-001.md) |
| SDC-LAYOUT-002 | Fiber Strand Fan Out | [SDC-LAYOUT-002.md](./SDC-LAYOUT-002.md) |
| SDC-LAYOUT-003 | Layout Modes, Side Assignment, and Cable Placement | [SDC-LAYOUT-003.md](./SDC-LAYOUT-003.md) |
| SDC-LABEL-001 | Label Placement and Text Collision | [SDC-LABEL-001.md](./SDC-LABEL-001.md) |
| SDC-ROUTE-001 | Fiber Strand Routing Zone | [SDC-ROUTE-001.md](./SDC-ROUTE-001.md) |
| SDC-ROUTE-002 | Fiber Strand Nesting | [SDC-ROUTE-002.md](./SDC-ROUTE-002.md) |
| SDC-ROUTE-003 | Fiber Strand Overlap, Crossing, and Collision | [SDC-ROUTE-003.md](./SDC-ROUTE-003.md) |
| SDC-ROUTE-004 | Orthogonal Path Geometry and Bend Limits | [SDC-ROUTE-004.md](./SDC-ROUTE-004.md) |
| SDC-SCORE-001 | Route Scoring, Retry Layout, and Rule Priority | [SDC-SCORE-001.md](./SDC-SCORE-001.md) |
| SDC-VALIDATE-001 | Validation Messages and Severity Levels | [SDC-VALIDATE-001.md](./SDC-VALIDATE-001.md) |
| SDC-UX-001 | Auto Layout and Manual Locks | [SDC-UX-001.md](./SDC-UX-001.md) |
| SDC-EXPORT-001 | Persistence, Config, PDF Export, and Reimport | [SDC-EXPORT-001.md](./SDC-EXPORT-001.md) |
| SDC-VISUAL-001 | Visual Color Rendering and Legend | [SDC-VISUAL-001.md](./SDC-VISUAL-001.md) |

## Recommended processing order

Shared numeric defaults [SDC-CONST-001] apply across every stage below (pitch, spacing, dot radius, stroke, bend limits).

1. Parse and normalize the imported CSV [SDC-IMPORT-001].
2. Build the cable, buffer tube, and strand hierarchy [SDC-DATA-001].
3. Infer 6-count or 12-count buffer tube grouping [SDC-DATA-002].
4. Validate buffer tube and fiber strand color order [SDC-ORDER-001], [SDC-ORDER-002].
5. Build splice connection pairs and fusion splice dots [SDC-CONNECT-001].
6. Choose layout mode and cable side assignments [SDC-LAYOUT-003].
7. Place cables, buffer tubes, labels, and fanouts [SDC-LAYOUT-001], [SDC-LAYOUT-002], [SDC-LABEL-001].
8. Calculate routing zone boundaries and grid occupancy [SDC-ROUTE-001], [SDC-GRID-001].
9. Apply locked manual overrides as fixed constraints [SDC-UX-001].
10. Build nested cable, buffer tube, strand, and connection groups [SDC-ROUTE-002].
11. Route strands using approved orthogonal path geometry [SDC-ROUTE-004].
12. Validate overlap, crossing, collision, spacing, labels, and reserved areas [SDC-ROUTE-003], [SDC-LAYOUT-001], [SDC-LABEL-001].
13. Score the candidate layout and retry if needed [SDC-SCORE-001].
14. Produce validation messages for the UI and AI agent [SDC-VALIDATE-001].
15. Render visual colors, layers, selection state, and legend [SDC-VISUAL-001].
16. Save, export PDF, export config, or reimport saved diagram state [SDC-EXPORT-001].

## Conflict priority

When rules conflict, resolve them in this order:

1. Imported data identity, source rows, cable IDs, strand numbers, and connection pairings must not be changed by layout [SDC-IMPORT-001], [SDC-DATA-001], [SDC-CONNECT-001].
2. Absolute fiber strand numbers must never be renumbered by sorting, grouping, fanout generation, or visual placement [SDC-DATA-002], [SDC-LAYOUT-002].
3. Locked manual overrides are fixed constraints unless the user unlocks them [SDC-UX-001].
4. Fiber routes must stay inside the valid routing zone and avoid reserved cable, fanout, and label areas [SDC-ROUTE-001], [SDC-LABEL-001].
5. Fiber routes must use approved grid lanes, grid intersections, and orthogonal path geometry [SDC-GRID-001], [SDC-ROUTE-004].
6. Overlap, collision, illegal shared lanes, and invalid crossings are routing failures [SDC-ROUTE-003].
7. Minimum spacing must be preserved unless the controlled crossing exception applies [SDC-LAYOUT-001], [SDC-ROUTE-003].
8. Nesting and grouping should be preserved unless breaking nesting is required to solve a higher-priority failure [SDC-ROUTE-002].
9. Fewer bends, shorter paths, compact placement, and aesthetic neatness are optimization goals handled by scoring [SDC-SCORE-001].
10. PDF/export output must preserve the accepted layout and must not silently rebuild a different diagram [SDC-EXPORT-001].

## Related rule matrix

| Rule | Most related rules |
|---|---|
| SDC-CORE-001 | All rules |
| SDC-IMPORT-001 | SDC-DATA-001, SDC-DATA-002, SDC-CONNECT-001, SDC-VALIDATE-001, SDC-EXPORT-001 |
| SDC-DATA-001 | SDC-DATA-002, SDC-ORDER-001, SDC-ORDER-002, SDC-LAYOUT-002, SDC-ROUTE-002, SDC-UX-001 |
| SDC-DATA-002 | SDC-DATA-001, SDC-ORDER-001, SDC-ORDER-002, SDC-LAYOUT-002 |
| SDC-ORDER-001 | SDC-DATA-001, SDC-DATA-002, SDC-LAYOUT-002, SDC-ROUTE-002 |
| SDC-ORDER-002 | SDC-DATA-001, SDC-DATA-002, SDC-LAYOUT-002, SDC-ROUTE-002, SDC-LAYOUT-001 |
| SDC-CONNECT-001 | SDC-IMPORT-001, SDC-DATA-001, SDC-LAYOUT-003, SDC-ROUTE-001, SDC-ROUTE-004, SDC-UX-001 |
| SDC-GRID-001 | SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-LAYOUT-001, SDC-UX-001 |
| SDC-LAYOUT-001 | SDC-LAYOUT-002, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-GRID-001 |
| SDC-LAYOUT-002 | SDC-ORDER-002, SDC-LAYOUT-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-LABEL-001 |
| SDC-LAYOUT-003 | SDC-CORE-001, SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-ROUTE-001, SDC-SCORE-001, SDC-UX-001 |
| SDC-LABEL-001 | SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-ROUTE-001, SDC-GRID-001, SDC-VISUAL-001, SDC-EXPORT-001 |
| SDC-ROUTE-001 | SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-UX-001 |
| SDC-ROUTE-002 | SDC-DATA-001, SDC-LAYOUT-002, SDC-GRID-001, SDC-LAYOUT-001, SDC-ROUTE-001, SDC-ROUTE-003 |
| SDC-ROUTE-003 | SDC-GRID-001, SDC-LAYOUT-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-004, SDC-UX-001 |
| SDC-ROUTE-004 | SDC-GRID-001, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-CONNECT-001, SDC-SCORE-001 |
| SDC-SCORE-001 | SDC-GRID-001, SDC-LAYOUT-001, SDC-LAYOUT-003, SDC-ROUTE-001, SDC-ROUTE-002, SDC-ROUTE-003, SDC-ROUTE-004, SDC-LABEL-001, SDC-UX-001 |
| SDC-VALIDATE-001 | All rules |
| SDC-UX-001 | SDC-GRID-001, SDC-ROUTE-001, SDC-ROUTE-003, SDC-LAYOUT-001, SDC-LAYOUT-002, SDC-ROUTE-002, SDC-CONNECT-001 |
| SDC-EXPORT-001 | SDC-IMPORT-001, SDC-VALIDATE-001, SDC-UX-001, SDC-VISUAL-001 |
| SDC-VISUAL-001 | SDC-ORDER-001, SDC-ORDER-002, SDC-ROUTE-003, SDC-LABEL-001, SDC-EXPORT-001 |

## Open gaps (recommended follow-up rules)

These were flagged during adoption of the pack and are not yet written:

- **Exact fusion-dot placement geometry**: `SDC-CONNECT-001` covers identity/order/spacing but not precise 2-sided center-column coordinates or 4-sided distribution math.
- **Page sizing / print fit** beyond "avoid clipping", and **interaction beyond locks** (multi-select, undo/redo) — minor.

Written since: **SDC-CONST-001** (layout constants/defaults) — see the active rules table; canonical values exported as `SDC_DEFAULTS` in `src/features/layout/sdcDefaults.ts`.

## Implementing a rule in code

Rule modules live in `src/features/rules/` (see [`../RULES_MODULAR.md`](../RULES_MODULAR.md)). Use the lowercase module id (e.g. `SDC-IMPORT-001` -> `sdc-import-001`) and emit `RuleViolation`s compatible with [SDC-VALIDATE-001] (severity, objectIds, sourceRows, suggestedFix). Only `error`-severity violations fail a run.

### Implemented (data stage)

| Rule | Module | Notes |
|---|---|---|
| SDC-IMPORT-001 | `src/features/rules/sdc-import-001/` | Normalized-model integrity (parse gap, source rows). Model built by `src/features/import/normalize/normalizeImport.ts`. |
| SDC-DATA-001 | `src/features/rules/sdc-data-001/` | Hierarchy: orphans, duplicate ids, empty tubes/cables. |
| SDC-DATA-002 | `src/features/rules/sdc-data-002/` | Absolute number validity + inferred count; low-confidence inference is a warning. Does not require full tube population. |
| SDC-CONNECT-001 | `src/features/rules/sdc-connect-001/` | One dot per pair, endpoints resolve, duplicate/identical detection. |
| SDC-GRID-001 (partial) | `src/features/rules/sdc-grid-001/` | Routing-output integrity: route/connection count, lane-segment overlap, unroutable legs as warnings. Segment-status model in `src/features/grid/segmentStatus.ts`. Full lane/quadrant rebuild pending. |

Data-stage rules read `snapshot.normalizedImport` and return `[]` when it is absent. `sdc-grid-001` is routing-stage and reads `snapshot.routing`. Remaining rules (layout, route geometry, score, label, validate, export, visual) are spec-only. Shared numeric defaults are in `SDC-CONST-001` (`src/features/layout/sdcDefaults.ts`).
