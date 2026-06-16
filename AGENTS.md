# Agent guide — Splice Detail Canvas (rebuild shell)

Frontend-only React PWA with an empty React Flow canvas. Rebuilding import, layout, routing, and manual adjust from scratch.

Read [`docs/agent/README.md`](docs/agent/README.md) first, then [`REBUILD.md`](docs/agent/REBUILD.md).

## Read first

| File | Purpose |
|------|---------|
| `docs/agent/README.md` | **Index** — active vs archived docs |
| `docs/agent/REBUILD.md` | Shell status, what was kept vs removed |
| `docs/agent/SCOPE.md` | Product vision (unchanged at high level) |
| `docs/agent/CONTEXT.md` | Current focus (current-only) |
| `docs/agent/HANDOFF.md` | Last session summary |
| `docs/agent/ARCHITECTURE.md` | Folder layout |
| `docs/reference/examples/README.md` | Bentley CSV examples for future import work |

Archived (prior app): `docs/archive/` — old rules, layout docs, refactor plan.

## Workflow

1. Read REBUILD → SCOPE → CONTEXT + HANDOFF.
2. Implement in `src/`; shared UI in `src/components/`.
3. Run `npm run check`, `npm run test:ci`, `npm run build`.
4. Update CONTEXT + HANDOFF before ending.

## Constraints

- **Keep:** neumorphic theme, toolbar buttons/icons, React Flow canvas host.
- **Rebuild:** CSV import, layout, routing, manual adjust, export/print logic.
- No new npm packages without user approval.
- Prefer `@/` imports from `src/`.

## Stack

- Vite 6, React 19, TypeScript (strict)
- `@xyflow/react` for the canvas
- Vitest + Testing Library
- `vite-plugin-pwa` for installable PWA

## Commands

```bash
npm run dev      # local dev server
npm run check    # typecheck
npm run test:ci  # unit tests
npm run build    # production build
npm run verify   # check + test:ci + build
```

## Response style

See `.cursor/rules/concise-responses.mdc`. Short bullets; user types **expand** for detail.
