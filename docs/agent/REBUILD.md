# Rebuild status

> **Status:** SDC rule pack adopted (`SDC-RULES-2026-06`). Import, horizontal grid/routing, and validators largely rebuilt; **interaction (SDC-UX-001) is next.**

## Rebuild progress

| Step | Rules | Status |
|------|-------|--------|
| 1 Import | SDC-IMPORT/DATA/CONNECT | Done — normalized model + validators |
| 2 Grid | SDC-GRID-001 | Done (horizontal); quad deferred |
| 3 Layout | SDC-LAYOUT-* | Partial — fanout geometry + side assignment; not all layout validators |
| 4 Routing | SDC-ROUTE-*, SDC-SCORE-001 | Done (horizontal); validators registered |
| 5 Interaction | **SDC-UX-001** | **Done** — hybrid locks, no mode toggle |
| 6 Export | SDC-EXPORT-001, etc. | Not started |

## Product goal (unchanged)

PWA that imports a Bentley CSV of fiber splice connections and renders an organized, uniform, interactive splice diagram on a canvas — exportable and printable.

## What we kept (do not change without user approval)

| Layer | Location |
|-------|----------|
| Neumorphic theme | `src/styles/neumorphic-tokens.css`, `neumorphic.css`, chrome in `splice-diagram.css` |
| App shell | `src/components/layout/AppShell.tsx` |
| Toolbar (all buttons/icons) | `WorkflowCanvas.tsx` + `src/components/toolbar/` |
| Import button UI | `src/components/import/CsvImportButton.tsx` |
| Map button UI | `src/components/maps/MapEmbedButton.tsx` (stub popover) |
| Help modal | `src/components/help/` |
| React Flow canvas | `src/features/canvas/WorkflowCanvas.tsx` |
| PWA + CI | `vite.config.ts`, `.github/workflows/` |
| Reference CSVs/images | `docs/reference/` |

## Current engines (rebuild to match SDC rules)

These exist in `src/` from the prior phase. Each predates its SDC rule and will be reconciled:

- CSV import / parser (`src/features/import/`) -> [`SDC-IMPORT-001`](./rules/SDC-IMPORT-001.md)
- Diagram domain model (`src/features/diagram/`) -> [`SDC-DATA-001`](./rules/SDC-DATA-001.md), [`SDC-CONNECT-001`](./rules/SDC-CONNECT-001.md)
- Layout (`src/features/layout/`, ELK, horizontal + quad) -> [`SDC-LAYOUT-003`](./rules/SDC-LAYOUT-003.md)
- Routing + scoring (`src/features/routing/`) -> [`SDC-ROUTE-004`](./rules/SDC-ROUTE-004.md), [`SDC-SCORE-001`](./rules/SDC-SCORE-001.md)
- Grid (`src/features/grid/`, 24px pitch, LaneBook) -> [`SDC-GRID-001`](./rules/SDC-GRID-001.md)
- Placement candidates (`src/features/rules/placement/`) -> superseded by `SDC-LAYOUT-003` + `SDC-SCORE-001`

Rules: modular — one module per rule. See [`RULES_MODULAR.md`](./RULES_MODULAR.md). Specs live in [`rules/`](./rules/); code modules go under `src/features/rules/`.

## Rebuild order (suggested — user may override)

1. **Import** — Bentley CSV → normalized model (`SDC-IMPORT-001`, `SDC-DATA-001/002`, `SDC-CONNECT-001`)
2. **Grid** — invisible routing grid + lanes (`SDC-GRID-001`)
3. **Layout** — side assignment, fanouts, labels (`SDC-LAYOUT-001/002/003`, `SDC-LABEL-001`)
4. **Routing** — orthogonal geometry + scoring (`SDC-ROUTE-001..004`, `SDC-SCORE-001`)
5. **Interaction** — auto layout + manual locks (`SDC-UX-001`)
6. **Validation + export** — messages, PDF/config (`SDC-VALIDATE-001`, `SDC-EXPORT-001`, `SDC-VISUAL-001`)

## Quality

```bash
npm run verify   # check + test:ci + build
```

## Reference data

Bentley CSV examples: `docs/reference/examples/Left-*.csv`
