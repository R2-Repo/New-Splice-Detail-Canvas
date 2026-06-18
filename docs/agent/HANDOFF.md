# Handoff

> Agents: overwrite this section at the end of each session.

## Last updated

2026-06-17 — **Adopted SDC rule pack as canonical specs**

### What was done

- Integrated the 21-rule SDC pack (12 standardized + 9 gap) as per-rule specs under [`rules/`](./rules/), version `SDC-RULES-2026-06`.
- Wrote the single canonical index [`rules/README.md`](./rules/README.md) (rule list, unified processing order, conflict priority, related matrix, open-gaps list).
- Reconciled conflicting active docs to point at the rules: `GRID.md` -> `SDC-GRID-001`, `IMPORT.md` -> `SDC-IMPORT-001` (Bentley appendix folded into the rule), `SDC_JSON.md` marked superseded by `SDC-EXPORT-001`.
- Retired old docs: deleted `docs/archive/` (old glossary `CANVAS_GLOSSARY`/`SIMPLE_TERMS`/`RULE_DICTIONARY`, old rules `LAYOUT_RULES`/`RULE_PRIORITY`/`QUAD_LAYOUT`/`CSV_SEMANTICS`, plans/history), `docs/agent/CSV_SP-3254.5.md`, and `docs/agent/rules/sp3254-placement.md`. Removed the source `splice_detail_canvas_rule_pack/` folder.
- Fixed dangling links in `README.md`, `CONTEXT.md`, `REBUILD.md`, `ARCHITECTURE.md`, `RULES_MODULAR.md`, `SCOPE.md`, `AGENTS.md`, the two `.cursor/rules/*.mdc`, and the `docs/reference/*` READMEs.
- No behavior code changes. `src/features/rules/registry.ts` is still empty.

### Red flags / contradictions (resolved in docs; code reconciliation pending)

- **Rule ID convention**: pack uses `SDC-<GROUP>-<NUMBER>`; the code framework uses kebab-case `RuleId`. Decision: SDC IDs are canonical; code module id = lowercase (`SDC-IMPORT-001` -> `sdc-import-001`).
- **Grid**: `SDC-GRID-001` defines lanes + 60px bend clearance but **no pitch**; code uses `GRID_PITCH=24px`. Also "quadrant" (center subdivisions) vs code `quadZones` (edge side zones) — vocabulary unified in the rule; code rename pending.
- **Import**: `SDC-IMPORT-001` is generic; the Bentley specifics (Left section authoritative, `<->` = one pair, blank To copies From, Terminating Device ignored, Right `---` hints-only, parse gap 0) were folded into the rule's Bentley appendix so nothing was lost.
- **Export schema**: `.sdc.json` v1 vs `DiagramConfig` (`SDC-EXPORT-001`) are different — migration needed.
- **Scoring**: code `crossings*1000 + loopBacks*500 + bends*100 + verticalSpread` vs `SDC-SCORE-001` reject-on-hard-failure + weighted-penalty model.
- **Doc/code drift (accepted)**: old placement/scoring code (`src/features/rules/placement/`, `scoreRouting.ts`) and tests (`sp3254Teaching.test.ts`, `sp3254Optimization.test.ts`) remain but their spec docs were retired. Reconcile in the routing rebuild.
- **Stale meta fixed**: `REBUILD.md` / cursor rules previously claimed engines were "removed"; corrected to "exists, rebuild to match rules."

### Missing parts in the pack (recommended follow-up rules)

- **Layout constants/defaults rule** (e.g. `SDC-CONST-001`): grid pitch, page/canvas size, fanout min/max + strand spacing values, fusion-dot radius + center-band geometry. Only 60px clearance and visual stroke widths are defined; the pack's own big-picture review asked for this.
- **Exact fusion-dot placement geometry** (2-sided center column coords; 4-sided distribution math).
- **Page sizing / print fit** beyond "avoid clipping"; **interaction beyond locks** (multi-select, undo/redo). Minor.

### Next session

- Pick the first rule(s) to implement as code modules (suggest `SDC-IMPORT-001` -> `SDC-DATA-001/002` -> `SDC-CONNECT-001`).
- Consider writing the layout-constants follow-up rule before the routing rebuild.
- Reconcile / retire the old placement + scoring code as routing is rebuilt.
