# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-18 — **Visual polish toward the PDF oracle**

### What was done (verified against the rendered oracle)
- Rounded corners on splice routes (`routeConnections.pointsToPath` -> quadratic bevels).
- Oracle-style strand labels: `(OS) COLOR` on the left, `COLOR (OS)` on the right (`FiberAnchorNode`).
- Bigger buffer-tube color labels (BL/GR/VI).
- Title/metadata block top-left: added `location`/`reportDate` to `ConnectionGraph` (set in `buildConnectionGraph`), new `TitleNode` rendering Splice#/Report Date/Desc/Location.
- `npm run verify` green (101 tests, build OK). View: `http://localhost:5173/?sample=sp3254`.

### Result
Close to the oracle: title block, cable boxes, tube-color breakout fans with big labels, `(OS) COLOR` labels, rounded fanned routing into center fusion dots, 10 correct splices.

### Remaining gaps vs oracle (next)
- Side distribution differs (72-SMF lands on the left here vs right in oracle 1) - this is the layout side heuristic.
- Tube "trunk" is a fan of thin curves rather than one thick trunk that splits.
- Right-side routing could bundle into cleaner vertical buses; reduce crossings.
- 4-side (quad) mode not restyled.

---

## Earlier — Fixed CSV import data model (major correctness bug)

### The bug (confirmed by dumping the model)
The SP-3254 CSV has 20 rows but they are **10 physical splices listed in both directions**, and every "To" fiber number is blank. The parser was (a) copying the From number onto the To side (so `144 VI/YL` became `#1` instead of its real `#117`, even impossible numbers like `6-DROP BL/#29`), and (b) keeping both directions, so the model had 20 connections / 40 fibers / 8 from/to legs — the diagram drew every splice twice.

### The fix
- `bentleyRow.ts`: derive blank To fiber numbers from tube+color via TIA (`deriveAbsoluteFiberNumber`, 12-count); made `endpointKey` physical-identity only (cable+tube+number+color) so bidirectional rows dedupe.
- `inspectBentleyCsv.ts`: treat `duplicatePair` as benign (not layout-blocking).
- Result for SP-3254: **10 splices, 20 fibers, 5 legs**, correct numbers (`144 VI/117/YL`, `6-DROP BL/3/GR`, ...). All reference CSVs were bidirectional too: STATE_OFFICE 104->52, SPI-215 136->68, SP-3254 20->10; one-directional examples (#1-3) unchanged.
- Updated tests to the corrected counts/behavior. `npm run verify` green (101 tests, build OK).

### Visual rebuild (earlier this session, kept)
- Cable boxes + tube-colored breakout fans (`FanoutEdge`) + big tube labels; fusion dots aligned to the left fiber row (straight left strands, routed right legs); color-coded strands + `#n COLOR`/OS labels.
- Dev loop: `?sample=sp3254` quick-loads `public/samples/sp3254.csv`; view at `http://localhost:5173/?sample=sp3254`.

### Still to do (visual polish vs oracle)
- Title/metadata block, bigger tube labels at zoom, reduce right-side crossings (lane bundling), rounded corners, restyle 4-side mode.
- Side assignment heuristic puts 72-SMF on the right; verify desired orientation.

---

## Earlier — Visual rebuild iterated against the PDF oracles

### What was done

- Compared the app to the reference PDFs (rendered via a temporary pdf.js page over a local http server, screenshotted in the Cursor browser). Confirmed the target style: small cable boxes, a buffer-tube breakout fan, straight left strands into center fusion dots, routed right legs, big tube labels.
- Redesigned the render toward the oracles:
  - `CableNode` is now a small labeled box (`.sdc-cablebox`), not a tall color bar.
  - `buildReactFlowGraph` adds a tube-colored **breakout fan** (`fanout` edges via `FanoutEdge`) from each cable box to its fibers, plus big tube-head labels (`.sdc-tube-label`).
  - `computeHorizontalLayout` now sets each fusion dot row = the **left fiber's row**, so left strands run straight and routing/fanning happens on the right (matches the oracles).
- Dev tooling: `?sample=<name>` auto-loads `public/samples/<name>.csv` (added `sp3254.csv`) so the diagram can be screenshotted at `http://localhost:5173/?sample=sp3254`.
- `npm run verify` green (101 tests, build OK). Dev server may be left running.

### Still to close vs oracle (next)

- Title/metadata block (top-left), bigger tube labels at normal zoom, reduce remaining center/right crossings (lane bundling), rounded corners on routes, and tune spacing.
- Quad/4-side mode not yet restyled.

---

## Earlier — Visual splice-detail rebuild (two-sided)

### What was done (4 reviewable increments)

1. Color: `src/features/diagram/fiberColorHex.ts` (TIA->hex, SDC-VISUAL-001); `buildReactFlowGraph` passes fiber color to edges + fiber/splice dots; `SpliceEdge` strokes in fiber color (white/yellow get a dark casing) at `SDC_DEFAULTS` width.
2. Layout: `computeHorizontalLayout` rewritten to deterministic fanout geometry - fibers grouped by cable -> buffer tube (TIA order) with fanout spacing, cables at the edges, one fusion dot per connection spread down a center column. `routeConnections` horizontal branch now builds fanned orthogonal legs (fanout-exit -> bend (>=60px clearance) -> center dot -> bend -> fanout-exit). ELK dropped on the horizontal path.
3. Cable visuals: `CableNode` renders a vertical buffer-tube color bar spanning its fanout (+ striped pattern); `buildReactFlowGraph` computes per-cable span + tube colors. Diagram-only CSS in `splice-diagram.css` (`.sdc-cable*`).
4. Labels: `FiberAnchorNode` shows fiber code (`#n COLOR`) + OS circuit name, placed outboard per side (`.sdc-fiber-label*`).

### Tests
- `npm run verify` green (101 tests, build OK). The SP-3254 anchor test was intentionally relaxed (old exact `score: 2024` removed) to structural invariants (routes=20, finite score, no route errors, bends>0) since the layout/routing changed. `SP3254_HORIZONTAL_SCORE_BASELINE` raised to 30000 as a gross-regression ceiling.

### Known follow-ups (visual polish)
- Center has crossings (no lane bands yet); fanned legs can overlap - add nesting/lane separation + a real scorer (`SDC-SCORE-001`) and make geometry hard rules (`SDC-ROUTE-004`).
- Four-sided/quad mode still unbuilt for this new style.
- Could not auto-screenshot (import is file-input only; browser tool can't drive the file picker) - review with `npm run dev` -> Import `docs/reference/examples/Left-SP-3254.5.csv`.

---

## Earlier — Validation wired into the live app

### What was done

- Added `src/features/rules/validateImport.ts`: `snapshotFromImportResult`, `validateImportResult` (runs all registered SDC rules on an `ImportResult`), and `formatValidation`.
- `WorkflowCanvas` now validates every import: toolbar hint shows `N err / N warn` (or "checks passed"), and `ParseInspectOverlay` renders the full validation list (rule id, severity, source rows, suggested fix). So the data/grid validators now do real work in the UI, not just tests.
- Added `validateImport.test.ts`.
- `npm run verify` green (101 tests, build OK).

### Gotcha recorded

- Browser code must NOT import the `@/features/rules` barrel — it re-exports `referenceExamples`/`buildSnapshot` which use `node:fs` and break the Vite build. Import `@/features/rules/validateImport` and `@/features/rules/types` directly. (This bit the first build; fixed.)

### Next session

- Adopt `GridSegmentStatus` in `LaneBook`; rebuild routing geometry (`SDC-ROUTE-004`) + scoring (`SDC-SCORE-001`) on `SDC_DEFAULTS`. Consider a dedicated validation panel/badges instead of the toolbar-hint summary.

---

## Earlier — Grid integrity validator (SDC-GRID-001 partial)

### What was done

- Added the grid segment-status model `src/features/grid/segmentStatus.ts` (`GridSegmentStatus` = available/reserved/occupied/blocked/manual-locked + `isBlockingStatus`); exported from `grid/index.ts`. Not yet adopted by `LaneBook` (routing rebuild will).
- Implemented + registered routing-stage `sdc-grid-001` (`src/features/rules/sdc-grid-001/`): route/connection count match, no empty path without an error, no overlapping booked lane segments. Unroutable legs (`routeError`) surface as non-blocking warnings.
- Tests: unit (count mismatch, unroutable warning, empty-path error, lane overlap, empty pass) + reference (Example #1, SP-3254). Updated `rules/README.md` to mark SDC-GRID-001 partial.
- `npm run verify` green (99 tests, build OK).

### Notes

- This is the routing-output integrity slice of SDC-GRID-001, scoped to what the current SVG-path routing can be checked against. The full lane/segment-status grid + bend-clearance lives with `SDC-ROUTE-004` and the routing rebuild.

### Next session

- Adopt `GridSegmentStatus` in `LaneBook`; rebuild routing geometry (`SDC-ROUTE-004`) and scoring (`SDC-SCORE-001`) on `SDC_DEFAULTS`.

---

## Earlier — Layout constants rule (SDC-CONST-001)

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
