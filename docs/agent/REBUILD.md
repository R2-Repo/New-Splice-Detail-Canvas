# Rebuild — empty shell

> **Status:** Shell ready. Engines removed. Rebuild import → layout → routing next.

## Product goal (unchanged)

PWA that imports a Bentley CSV of fiber splice connections and renders an organized, uniform, interactive splice diagram on a canvas — exportable and printable.

## What we kept

| Layer | Location |
|-------|----------|
| Neumorphic theme | `src/styles/neumorphic-tokens.css`, `neumorphic.css`, chrome in `splice-diagram.css` |
| App shell | `src/components/layout/AppShell.tsx` |
| Toolbar (all buttons/icons) | `WorkflowCanvas.tsx` + `src/components/toolbar/` |
| Import button UI | `src/components/import/CsvImportButton.tsx` (no parser wired) |
| Map button UI | `src/components/maps/MapEmbedButton.tsx` (stub popover) |
| Help modal | `src/components/help/` |
| React Flow canvas | `src/features/canvas/WorkflowCanvas.tsx` — empty nodes/edges |
| PWA + CI | `vite.config.ts`, `.github/workflows/` |
| Reference CSVs/images | `docs/reference/` |

## What we removed

- CSV parser (`parseBentleyCsv`, import pipeline)
- Layout rules + contract tests (`layoutRules.ts`, `LAYOUT_RULES.md`, etc.)
- Routing engine (`spliceEdgeRouting`, `centerRouter`, quad engine, …)
- Manual adjustment engine
- Diagram domain model, nodes, edges, export/print logic
- All layout/routing/manual-adjust tests

Archived prior docs: `docs/archive/` — **not active requirements**.

## Instruction hygiene (ground-zero ready)

| Status | What |
|--------|------|
| ✅ | No engines/rules in `src/` |
| ✅ | Cursor rules: `rebuild-phase`, `project-core`, `react-ui`, `concise-responses` only |
| ✅ | Active agent docs: see [`README.md`](./README.md) (5 files) |
| 📦 | Old rules/plans in `docs/archive/` |
| 📎 | CSVs/images/routing screenshots = reference only until you cite them |
| ⏳ | Toolbar + help = UI shell; behavior TBD |

Add your new rules to `docs/agent/` or `.cursor/rules/` when ready.

## Rebuild order (suggested — user may override)

1. **Domain + CSV import** — parse Bentley CSV → connection graph
2. **Layout** — cable/tube/fiber placement on canvas
3. **Routing** — splice legs / center lanes
4. **Interaction** — drag, manual adjust, existing toggle
5. **Export / print** — config save, PDF/print

## Toolbar remapping

Buttons are visible; most are **disabled** until a diagram loads (`hasDiagram = false` in `WorkflowCanvas.tsx`). Wire behavior as each subsystem is rebuilt.

## Quality

```bash
npm run verify   # check + test:ci + build
```

## Reference data

Bentley CSV examples: `docs/reference/examples/Left-*.csv`
