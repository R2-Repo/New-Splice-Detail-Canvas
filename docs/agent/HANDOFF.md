# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-17 — **Layout constants rule (SDC-CONST-001)**

### What was done

- Wrote [`SDC-CONST-001`](./rules/SDC-CONST-001.md): canonical numeric defaults (grid pitch/gap, bend clearance, fanout min/default/max spacing, cable-group separation, strand buffer, fusion dot radius, stroke widths, bend limits, page padding). Config rule, no validator module.
- Added `src/features/layout/sdcDefaults.ts` exporting `SDC_DEFAULTS` (composes `GRID_PITCH`/`TUBE_GROUP_GAP` from grid constants) + `sdcDefaults.test.ts` (invariant checks).
- Updated [`rules/README.md`](./rules/README.md): added `CONST` group + rule row + processing-order note; removed constants from Open gaps.
- `npm run verify` green (91 tests, build OK).

### Next session

- Rebuild the grid (`SDC-GRID-001`) using `SDC_DEFAULTS`: lane/segment model, `available/reserved/occupied/blocked/manual-locked` states, side zones + center quadrants vocabulary. Then routing (`SDC-ROUTE-004`, `SDC-SCORE-001`).
- New layout/routing/visual code must read `SDC_DEFAULTS` (no hardcoded pitch/spacing/dot/stroke).

---

## Earlier — Data foundation: normalized model + first rule modules

### What was done

- Added the normalized import model `src/features/import/normalize/` (`normalizeImport`, types): cable/tube/fiber records with source rows, per-cable 6/12 tube-count inference + confidence, one `ConnectionPair` + `FusionSpliceDot` per pair (deterministic ids), and warnings/errors. Wired into `runImport` as `ImportResult.normalizedImport` (non-breaking; `ConnectionGraph` unchanged).
- Extended the rules framework (`src/features/rules/types.ts`, `runRules.ts`): `RuleStage` adds `data`; `RuleViolation` gains `severity`/`objectType`/`objectIds`/`sourceRows`/`suggestedFix`; `runRules` returns `errors`/`warnings` and `passed` = no error-severity (per SDC-VALIDATE-001). `DiagramSnapshot.normalizedImport` added; `buildSnapshot` populates it.
- Implemented + registered four data-stage modules: `sdc-import-001`, `sdc-data-001`, `sdc-data-002`, `sdc-connect-001` (return `[]` when `normalizedImport` absent). Shared helper `sdcValidation.ts` forwards normalization messages.
- Tests: per-module unit + Example-#1 reference tests, `normalizeImport.test.ts` (SP-3254), updated `runRules.test.ts` (registered rules; error-based pass; SP-3254 coverage). `npm run verify` green (85 tests, build OK).

### Decisions / notes

- **Non-breaking**: `ConnectionGraph` stays the layout/routing contract; normalized model is an added layer.
- **Splice-only data is valid**: validators do not require full 6/12 tube population. `sdc-data-002` validates absolute-number validity + inferred count; low-confidence inference is a non-blocking warning.
- **No TIA color-position check** in `sdc-data-002`: real Bentley drop-side colors legitimately diverge from TIA position (e.g. SP-3254 row 5). Belongs to a future SDC-ORDER chunk; also reconcile `tiaColors.ts` `RO`/`-BK` vs SDC `RS`/`/S`.

### Next session

- Write the layout-constants follow-up rule (pitch, spacing defaults, dot geometry), then rebuild the grid (`SDC-GRID-001`) and routing (`SDC-ROUTE-004`, `SDC-SCORE-001`).
- Later: surface `normalizedImport.warnings`/validation in the UI; migrate `.sdc.json` v1 -> `DiagramConfig`.

---

## Earlier — Adopted SDC rule pack as canonical specs

### What was done

- Integrated the 21-rule SDC pack (12 standardized + 9 gap) as per-rule specs under [`rules/`](./rules/), version `SDC-RULES-2026-06`.
- Wrote the single canonical index [`rules/README.md`](./rules/README.md) (rule list, unified processing order, conflict priority, related matrix, open-gaps list).
- Reconciled conflicting active docs to point at the rules: `GRID.md` -> `SDC-GRID-001`, `IMPORT.md` -> `SDC-IMPORT-001` (Bentley appendix folded into the rule), `SDC_JSON.md` marked superseded by `SDC-EXPORT-001`.
- Retired old docs: deleted `docs/archive/` (old glossary `CANVAS_GLOSSARY`/`SIMPLE_TERMS`/`RULE_DICTIONARY`, old rules `LAYOUT_RULES`/`RULE_PRIORITY`/`QUAD_LAYOUT`/`CSV_SEMANTICS`, plans/history), `docs/agent/CSV_SP-3254.5.md`, and `docs/agent/rules/sp3254-placement.md`. Removed the source `splice_detail_canvas_rule_pack/` folder.
- Fixed dangling links in `README.md`, `CONTEXT.md`, `REBUILD.md`, `ARCHITECTURE.md`, `RULES_MODULAR.md`, `SCOPE.md`, `AGENTS.md`, the two `.cursor/rules/*.mdc`, and the `docs/reference/*` READMEs.
- No behavior code changes. `src/features/rules/registry.ts` is still empty.

### Red flags / contradictions (resolved in docs; code reconciliation pending)

- **Rule ID convention**: pack uses `SDC-<GROUP>-<NUMBER>`; the code framework uses kebab-case `RuleId`. Decision: SDC IDs are canonical; code module id = lowercase (`SDC-IMPORT-001` -> `sdc-import-001`).
- **Grid**: `SDC-GRID-001` defines lanes + 60px bend clearance but **no pitch**; code uses `GRID_PITCH=24px`. Also "quadrant" (center subdivisions) vs code `quadZones` (edge side zones) — vocabulary unified in the rule; code rename pending.
- **Import**: `SDC-IMPORT-001` is generic; the Bentley specifics (Left section authoritative, `<->` = one pair, blank To copies From, Terminating Device ignored, Right `---` hints-only, parse gap 0) were folded into the rule's Bentley appendix so nothing was lost.
- **Export schema**: `.sdc.json` v1 vs `DiagramConfig` (`SDC-EXPORT-001`) are different — migration needed.
- **Scoring**: code `crossings*1000 + loopBacks*500 + bends*100 + verticalSpread` vs `SDC-SCORE-001` reject-on-hard-failure + weighted-penalty model.
- **Doc/code drift (accepted)**: old placement/scoring code (`src/features/rules/placement/`, `scoreRouting.ts`) and tests (`sp3254Teaching.test.ts`, `sp3254Optimization.test.ts`) remain but their spec docs were retired. Reconcile in the routing rebuild.
- **Stale meta fixed**: `REBUILD.md` / cursor rules previously claimed engines were "removed"; corrected to "exists, rebuild to match rules."

### Missing parts in the pack (recommended follow-up rules)

- **Layout constants/defaults rule** (e.g. `SDC-CONST-001`): grid pitch, page/canvas size, fanout min/max + strand spacing values, fusion-dot radius + center-band geometry. Only 60px clearance and visual stroke widths are defined; the pack's own big-picture review asked for this.
- **Exact fusion-dot placement geometry** (2-sided center column coords; 4-sided distribution math).
- **Page sizing / print fit** beyond "avoid clipping"; **interaction beyond locks** (multi-select, undo/redo). Minor.

### Next session

- Pick the first rule(s) to implement as code modules (suggest `SDC-IMPORT-001` -> `SDC-DATA-001/002` -> `SDC-CONNECT-001`).
- Consider writing the layout-constants follow-up rule before the routing rebuild.
- Reconcile / retire the old placement + scoring code as routing is rebuilt.
