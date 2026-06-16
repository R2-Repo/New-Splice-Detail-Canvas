# Architecture

## Layout (rebuild shell)

```
src/
  components/
    layout/          # AppShell
    toolbar/         # Icons, toggles, segments, callouts control
    import/          # CsvImportButton (UI only)
    maps/            # MapEmbedButton (stub)
    help/            # Help & guide modal
  features/
    canvas/
      WorkflowCanvas.tsx   # Toolbar + empty React Flow
  styles/
    neumorphic-tokens.css
    neumorphic.css
    global.css
    splice-diagram.css     # Toolbar + canvas chrome (neumorphic)
docs/agent/          # REBUILD, SCOPE, CONTEXT, HANDOFF
docs/reference/      # CSV examples, images (not shipped)
docs/archive/        # Prior rules, layout docs, refactor plan
```

## Data flow (target — not implemented)

```
Bentley CSV
  → parse → connection graph
  → layout → node positions
  → route → edge paths
  → React Flow canvas (edit)
  → export / print
```

## Conventions

- Functional components; `@/` imports
- Shared UI in `src/components/`; feature logic in `src/features/`
- Tests next to source (`*.test.tsx` / `*.test.ts`)

## Quality gates

`npm run check` → `npm run test:ci` → `npm run build`
