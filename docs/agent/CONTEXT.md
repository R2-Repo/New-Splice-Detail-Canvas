# Context

> Agents: keep this file current-only.

## Phase

**Data foundation implemented.** Normalized import model + the first four data-stage rule modules are live and green. Next big-ticket: grid (`SDC-GRID-001`), then routing (`SDC-ROUTE-001..004`, `SDC-SCORE-001`).

## Baseline (2026-06-17)

| Item | Status |
|------|--------|
| Rule specs | 21 SDC rules under [`rules/`](./rules/); index in [`rules/README.md`](./rules/README.md) |
| Normalized model | `src/features/import/normalize/` (`normalizeImport`) — records, source rows, tube-count inference, connection pairs, fusion splice dots, warnings/errors. Wired into `runImport` (`ImportResult.normalizedImport`). |
| Rule framework | `src/features/rules/` — `RuleStage` adds `data`; `RuleViolation` has severity/objectIds/sourceRows/suggestedFix; `runRules.passed` = no error-severity. |
| Registered rules | `sdc-import-001`, `sdc-data-001`, `sdc-data-002`, `sdc-connect-001` (data stage). |
| Constants | `SDC-CONST-001` written; defaults exported as `SDC_DEFAULTS` (`src/features/layout/sdcDefaults.ts`). |
| `src/features/import/` | Bentley CSV parser + normalized layer; older `buildConnectionGraph` still the layout/routing contract |
| `src/features/layout/` | ELK, horizontal + quad; predates `SDC-LAYOUT-003` |
| `src/features/routing/` | LaneBook routing, `scoreRouting()` — predates `SDC-ROUTE-004` / `SDC-SCORE-001` |
| `src/features/grid/` | 24px pitch, zones, LaneBook — predates `SDC-GRID-001` |
| Quality | `npm run verify` green (85 tests) |

## In scope NOW

- Next: rebuild the grid (`SDC-GRID-001`) using `SDC_DEFAULTS`, then routing (`SDC-ROUTE-004`, `SDC-SCORE-001`).
- Data-stage validators check `normalizedImport`; warnings (e.g. low-confidence tube count) are non-blocking.
- New layout/routing/visual code MUST read `SDC_DEFAULTS` instead of hardcoding pitch/spacing/dot/stroke.

## Known doc/code gaps

See [`rules/README.md`](./rules/README.md) "Open gaps" and the per-rule "Implementation gap" notes. Highlights:
- Old placement/scoring code (`rules/placement/`, `scoreRouting.ts`) + its tests remain; superseded by `SDC-LAYOUT-003` + `SDC-SCORE-001`.
- Existing grid/layout code does not yet read `SDC_DEFAULTS`; wire it in during the grid rebuild.
- `.sdc.json` v1 vs `DiagramConfig` (`SDC-EXPORT-001`) needs migration.
- Color abbreviation mismatch: `tiaColors.ts` uses `RO`/`-BK`; SDC-ORDER uses `RS`/`/S`. `sdc-data-002` deliberately skips TIA color-position checks (Bentley drop-side colors legitimately diverge); revisit with the SDC-ORDER chunk.

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
