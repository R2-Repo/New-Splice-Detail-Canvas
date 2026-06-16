# Product scope — Splice Detail Canvas

> **Status:** Rebuild shell. High-level vision only — implementation rules TBD by user.

## Vision

Replace painful Bentley OpenComms splice-detail diagram work with a **frontend PWA** that:

1. Imports a Bentley **CSV** of spliced fiber pairs
2. Renders an organized, uniform, consistent splice diagram on a **React Flow canvas**
3. Stays **interactive** (drag, adjust, polish)
4. **Exports / prints** a presentable splice-detail sheet

**Not the goal:** Replace Bentley for network design — only splice-detail **diagram authoring**.

## Users

Fiber/telecom designers and field engineers who export Bentley splice CSVs and need presentable splice detail sheets.

## Stack (locked for shell)

```
CSV → [rebuild] → React Flow canvas → [rebuild] → export / print
```

- React 19 + Vite + TypeScript + `@xyflow/react`
- Frontend PWA only (no backend unless user adds one)
- Neumorphic app chrome (toolbar, panels, modals) — **do not change** without user approval

## Reference materials (data & visuals — not active rules)

| Source | Location |
|--------|----------|
| CSV examples | [`docs/reference/examples/`](../reference/examples/) |
| Layout screenshots | [`docs/reference/images/`](../reference/images/) |
| Routing screenshots | [`docs/reference/routing-examples/`](../reference/routing-examples/) — visual reference only |

Prior implementation rules and engines live in [`docs/archive/`](../archive/) — **not active requirements**.

## Out of scope (unless user adds)

- Bentley live API integration
- Backend, auth, collaboration
- New npm packages without user approval

## Success (high level)

- Import splice CSV; diagram is ~95% usable without manual rework
- Visual style matches industry splice-detail conventions
- Minutes to a usable diagram, not hours

## Local dev

```bash
npm install
npm run dev          # or double-click start-dev.bat
npm run verify       # check + test:ci + build
```
