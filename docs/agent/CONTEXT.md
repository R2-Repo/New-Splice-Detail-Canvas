# Context

> Agents: keep this file current-only.

## Phase

**Visual splice-detail rebuild (two-sided) in progress.** The canvas now renders color-coded strands, buffer-tube fanout grouping, centered fusion dots with fanned orthogonal legs, cable bodies as buffer-tube color bars, and fiber/OS labels. Review via `npm run dev`. Next polish: reduce center crossings (lane bands), four-sided mode, and turning routing geometry into hard rules (`SDC-ROUTE-004`/`SDC-SCORE-001`).

## Baseline (2026-06-17)

| Item | Status |
|------|--------|
| Rule specs | 21 SDC rules under [`rules/`](./rules/); index in [`rules/README.md`](./rules/README.md) |
| Normalized model | `src/features/import/normalize/` (`normalizeImport`) — records, source rows, tube-count inference, connection pairs, fusion splice dots, warnings/errors. Wired into `runImport` (`ImportResult.normalizedImport`). |
| Rule framework | `src/features/rules/` — `RuleStage` adds `data`; `RuleViolation` has severity/objectIds/sourceRows/suggestedFix; `runRules.passed` = no error-severity. |
| Registered rules | `sdc-import-001`, `sdc-data-001`, `sdc-data-002`, `sdc-connect-001` (data); `sdc-grid-001` (routing, partial). |
| Constants | `SDC-CONST-001` written; defaults exported as `SDC_DEFAULTS` (`src/features/layout/sdcDefaults.ts`). |
| Grid model | `GridSegmentStatus` vocabulary in `src/features/grid/segmentStatus.ts` (not yet adopted by `LaneBook`). |
| Validation in app | `validateImportResult` runs all rules on import; results shown in the toolbar hint + parse inspector (`src/features/rules/validateImport.ts`). |
| Visual render | Color via `src/features/diagram/fiberColorHex.ts`; fanout layout in `computeHorizontalLayout.ts` (deterministic, ELK dropped on this path); fanned routing in `routeConnections.ts`; cable/strand/label visuals in canvas nodes + `splice-diagram.css`. |
| `src/features/import/` | Bentley CSV parser + normalized layer; older `buildConnectionGraph` still the layout/routing contract |
| `src/features/layout/` | ELK, horizontal + quad; predates `SDC-LAYOUT-003` |
| `src/features/routing/` | LaneBook routing, `scoreRouting()` — predates `SDC-ROUTE-004` / `SDC-SCORE-001` |
| `src/features/grid/` | 24px pitch, zones, LaneBook — predates `SDC-GRID-001` |
| Quality | `npm run verify` green (85 tests) |

## In scope NOW

- Next: adopt `GridSegmentStatus` in `LaneBook`, then rebuild routing geometry (`SDC-ROUTE-004`) + scoring (`SDC-SCORE-001`) using `SDC_DEFAULTS`.
- Validators are non-blocking on warnings (low-confidence tube count, unroutable legs); only errors fail a run.
- New layout/routing/visual code MUST read `SDC_DEFAULTS` instead of hardcoding pitch/spacing/dot/stroke.

## Known doc/code gaps

See [`rules/README.md`](./rules/README.md) "Open gaps" and the per-rule "Implementation gap" notes. Highlights:
- Old placement/scoring code (`rules/placement/`, `scoreRouting.ts`) + its tests remain; superseded by `SDC-LAYOUT-003` + `SDC-SCORE-001`.
- Existing grid/layout code does not yet read `SDC_DEFAULTS`; wire it in during the grid rebuild.
- `.sdc.json` v1 vs `DiagramConfig` (`SDC-EXPORT-001`) needs migration.
- Color abbreviation mismatch: `tiaColors.ts` uses `RO`/`-BK`; SDC-ORDER uses `RS`/`/S`. `sdc-data-002` deliberately skips TIA color-position checks (Bentley drop-side colors legitimately diverge); revisit with the SDC-ORDER chunk.
- Browser code must NOT import the `@/features/rules` barrel (it re-exports `referenceExamples`/`buildSnapshot`, which use `node:fs`). Import browser-safe modules directly (`@/features/rules/validateImport`, `@/features/rules/types`).

## Out of scope

- Changing neumorphic theme or toolbar chrome without user approval.

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`SCOPE.md`](./SCOPE.md)
3. [`rules/README.md`](./rules/README.md)
4. [`RULES_MODULAR.md`](./RULES_MODULAR.md)
5. [`IMPORT.md`](./IMPORT.md)
6. [`GRID.md`](./GRID.md)
7. [`HANDOFF.md`](./HANDOFF.md)
