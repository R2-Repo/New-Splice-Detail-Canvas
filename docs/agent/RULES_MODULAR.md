# Modular rules

> **Status:** Framework scaffolded. Registry empty — user provides rule modules incrementally.

## Why modular

Prior attempts used one monolithic rules document for placement, routing, and connections. This rebuild gives **each rule its own module** with isolated tests, plus a **system suite** where all rules run together.

Archived monolith: [`docs/archive/LAYOUT_RULES.md`](../archive/LAYOUT_RULES.md) — reference only, not active requirements.

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

1. User sends: ID, requirement, stage, pass/fail examples, reference CSVs, related rules
2. Copy `_template/` → `<id>/`; implement `check()`
3. Write module tests (unit + reference)
4. Register in [`registry.ts`](../../src/features/rules/registry.ts)
5. Add [`docs/agent/rules/<id>.md`](./rules/)
6. Run `npm run test:rule -- <id>` → `npm run test:rules` → `npm run verify`

## Agent workflow

When changing import, layout, or routing: run affected `test:rule` targets, then `test:rules`, before `verify`.

Do not invent rules from `docs/archive/`.
