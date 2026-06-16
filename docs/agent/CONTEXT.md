# Context

> Agents: keep this file current-only.

## Phase

**Empty shell — rebuild from scratch.**

Neumorphic UI + toolbar + empty React Flow canvas are in place. All parsers, rules, routing, and manual-adjust code removed.

## Baseline (2026-06-15)

| Item | Status |
|------|--------|
| `npm run verify` | check + test:ci + build green |
| `hasDiagram` | always `false` until import rebuilt |
| Import button | UI only — `handleImport` is a no-op |

## In scope NOW

- Rebuild subsystems in user-directed order (see `REBUILD.md`)

## Out of scope

- Changing neumorphic theme or toolbar chrome without user approval

## Canonical docs

1. [`REBUILD.md`](./REBUILD.md)
2. [`SCOPE.md`](./SCOPE.md)
3. [`HANDOFF.md`](./HANDOFF.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
