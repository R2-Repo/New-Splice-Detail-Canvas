# Context

> Agents: keep this file current-only.

## Phase

**SDC rule pack adopted as canonical specs.** 21 rules (`SDC-RULES-2026-06`) live in [`rules/`](./rules/). Next: rebuild import, routing, and the grid to match — these are the big-ticket areas.

## Baseline (2026-06-17)

| Item | Status |
|------|--------|
| Rule specs | 21 SDC rules under [`rules/`](./rules/); index in [`rules/README.md`](./rules/README.md) |
| Rule framework | `src/features/rules/` (modular); `RULE_REGISTRY` is **empty** — no modules implemented yet |
| `src/features/import/` | Bentley CSV parser, `.sdc.json`, `runImport()` — predates `SDC-IMPORT-001` |
| `src/features/diagram/` | ConnectionGraph, strand groups, React Flow builder |
| `src/features/layout/` | ELK, horizontal + quad; predates `SDC-LAYOUT-003` |
| `src/features/routing/` | LaneBook routing, `scoreRouting()` — predates `SDC-ROUTE-004` / `SDC-SCORE-001` |
| `src/features/grid/` | 24px pitch, zones, LaneBook — predates `SDC-GRID-001` |

## In scope NOW

- Rules are docs-only so far. Code still reflects the prior SP-3254 approach.
- Next work: implement rules as code modules and rebuild import/routing/grid per the SDC pack.

## Known doc/code gaps

See [`rules/README.md`](./rules/README.md) "Open gaps" and the per-rule "Implementation gap" notes. Highlights:
- No layout-constants rule (pitch, spacing defaults, dot geometry).
- Old placement/scoring code (`rules/placement/`, `scoreRouting.ts`) + its tests remain; superseded by `SDC-LAYOUT-003` + `SDC-SCORE-001`.
- `.sdc.json` v1 vs `DiagramConfig` (`SDC-EXPORT-001`) needs migration.

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
