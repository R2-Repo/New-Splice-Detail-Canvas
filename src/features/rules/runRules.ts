import { RULE_REGISTRY } from "./registry";
import type {
  DiagramSnapshot,
  RuleId,
  RuleModule,
  RuleViolation,
  RunRulesOptions,
  RunRulesResult,
} from "./types";

export function runRule(module: RuleModule, snapshot: DiagramSnapshot): RuleViolation[] {
  return module.check(snapshot);
}

export function runRules(
  snapshot: DiagramSnapshot,
  options: RunRulesOptions = {},
): RunRulesResult {
  const onlySet = options.only ? new Set<RuleId>(options.only) : null;
  const modules = onlySet
    ? RULE_REGISTRY.filter((rule) => onlySet.has(rule.id))
    : RULE_REGISTRY;

  const resultsByRule = new Map<RuleId, RuleViolation[]>();
  const violations: RuleViolation[] = [];

  for (const module of modules) {
    const moduleViolations = runRule(module, snapshot);
    resultsByRule.set(module.id, moduleViolations);
    violations.push(...moduleViolations);
  }

  return {
    passed: violations.length === 0,
    violations,
    resultsByRule,
  };
}
