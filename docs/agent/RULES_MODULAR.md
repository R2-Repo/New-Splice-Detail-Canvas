# Modular rules

> **Status:** Framework scaffolded. Registry empty — rules implemented incrementally from the SDC pack.

## Why modular

Prior attempts used one monolithic rules document for placement, routing, and connections. This rebuild gives **each rule its own module** with isolated tests, plus a **system suite** where all rules run together.

Canonical specs: the SDC rule pack in [`rules/`](./rules/) (index: [`rules/README.md`](./rules/README.md)). Rule IDs use `SDC-<GROUP>-<NUMBER>`; the matching code module id is the lowercase form (e.g. `SDC-IMPORT-001` -> `sdc-import-001`).

## Collaboration

| You provide | Agent builds |
|-------------|--------------|
| Rule ID (kebab-case), requirement, pass/fail examples | `src/features/rules/<id>/ruleModule.ts` |
| Stage: `layout` / `routing` / `full` | Per-module unit + reference tests |
| Related rules, reference CSVs | Registry entry, spec doc, system-suite coverage |

## Code layout

```
src/features/rules/
  types.ts              # RuleModule, DiagramSnapshot, violations
  buildSnapshot.ts      # import → layout → route → snapshot
  referenceExamples.ts  # Example CSV #1–#3 paths
  registry.ts           # RULE_REGISTRY (ordered)
  runRules.ts           # run one / all rules
  runRules.test.ts      # system suite
  _template/            # copy when adding a rule
  <your-rule-id>/
    ruleModule.ts
    ruleModule.test.ts
```

Human specs: [`docs/agent/rules/`](./rules/)

## RuleModule contract

```typescript
{
  id: ruleId("your-rule-id"),
  title: "Plain English title",
  stage: "layout" | "routing" | "full",
  check(snapshot) → RuleViolation[]  // empty = pass
}
```

`DiagramSnapshot` includes `connectionGraph`, `layout`, `routing`, and `reactFlow` from the live pipeline ([`runImport`](../../src/features/import/runImport.ts)).

## Tests — per module AND system

| Level | Location | Purpose |
|-------|----------|---------|
| Module unit | `<id>/ruleModule.test.ts` | Synthetic fixtures, fast |
| Module reference | same file, name or `describe` includes `reference` | Rule passes on Example CSV(s) |
| System | `runRules.test.ts` | **All registered rules** pass together on each example |

## Commands

```bash
npm run test:rule -- <your-rule-id>   # one rule module
npm run test:rules                    # all rule tests (modules + system)
npm run test:rules:reference          # reference CSV tests only
npm run verify                        # full CI gate
```

## Add a rule (checklist)

1. Pick the SDC spec from [`rules/`](./rules/) (ID, requirement, related rules, pass/fail behavior)
2. Copy `_template/` → `<sdc-id>/` (lowercase); implement `check()`
3. Emit `RuleViolation`s compatible with [`SDC-VALIDATE-001`](./rules/SDC-VALIDATE-001.md)
4. Write module tests (unit + reference)
5. Register in [`registry.ts`](../../src/features/rules/registry.ts)
6. Run `npm run test:rule -- <sdc-id>` → `npm run test:rules` → `npm run verify`

## Agent workflow

When changing import, layout, or routing: run affected `test:rule` targets, then `test:rules`, before `verify`.

All behavior comes from the SDC rule pack ([`rules/`](./rules/)). Do not invent rules outside it.
