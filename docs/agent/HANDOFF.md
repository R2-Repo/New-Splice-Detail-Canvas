# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-15 — **Stripped to empty PWA shell.**

### What was done

- **Kept:** neumorphic theme, full toolbar UI, Help modal, empty React Flow canvas, PWA/CI.
- **Removed:** CSV parser, layout rules, routing engine, manual adjust, diagram nodes/edges, export/print, domain types, ~200 engine files.
- **Moved to `src/components/`:** `CsvImportButton`, `MapEmbedButton` (stub), `calloutScale` helpers.
- **Archived:** `LAYOUT_RULES.md`, rule dictionaries, refactor plan → `docs/archive/`.
- **Deleted cursor rules:** `frozen-routing`, `layout-rules`, `simple-terms`.
- **Scripts:** dropped `test:layout` / `test:engine`; `verify` = check + test:ci + build.

### Next session

User directs rebuild order — likely CSV import + domain model first. Wire `handleImport` in `WorkflowCanvas.tsx` when parser lands.
