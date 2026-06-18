# Agent guide — Splice Detail Canvas (rebuild shell)

Frontend-only React PWA with an empty React Flow canvas. Rebuilding import, layout, routing, and manual adjust from scratch.

Read [`docs/agent/README.md`](docs/agent/README.md) first, then [`REBUILD.md`](docs/agent/REBUILD.md).

## Read first

| File | Purpose |
|------|---------|
| `docs/agent/README.md` | **Index** — active docs |
| `docs/agent/REBUILD.md` | Rebuild status, what was kept vs rebuilt |
| `docs/agent/SCOPE.md` | Product vision (unchanged at high level) |
| `docs/agent/rules/README.md` | **SDC rule pack index** — canonical behavior specs |
| `docs/agent/CONTEXT.md` | Current focus (current-only) |
| `docs/agent/HANDOFF.md` | Last session summary |
| `docs/agent/ARCHITECTURE.md` | Folder layout |
| `docs/reference/examples/README.md` | Bentley CSV examples for future import work |

Behavior source of truth: the SDC rule pack in `docs/agent/rules/` (`SDC-RULES-2026-06`).

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
npm run test:rules          # all rule module + system tests
npm run test:rule -- <id>   # single rule module
npm run test:rules:reference  # reference CSV rule tests
npm run build    # production build
npm run verify   # check + test:ci + build
```

## Rules

Canonical behavior specs are the SDC rule pack: [`docs/agent/rules/`](docs/agent/rules/) (index: [`rules/README.md`](docs/agent/rules/README.md)). Code modules are modular under `src/features/rules/`; see [`docs/agent/RULES_MODULAR.md`](docs/agent/RULES_MODULAR.md). When changing import, layout, or routing, run `test:rule` / `test:rules` before `verify`.

## Response style

See `.cursor/rules/concise-responses.mdc`. Short bullets; user types **expand** for detail.
