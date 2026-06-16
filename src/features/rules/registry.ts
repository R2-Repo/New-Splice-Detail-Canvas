import type { RuleId, RuleModule, RuleStage } from "./types";

/** Active rule modules in pipeline order. Add new rules here when the user provides specs. */
export const RULE_REGISTRY: RuleModule[] = [];

export function listRules(): readonly RuleModule[] {
  return RULE_REGISTRY;
}

export function getRule(id: RuleId): RuleModule | undefined {
  return RULE_REGISTRY.find((rule) => rule.id === id);
}

export function rulesByStage(stage: RuleStage): RuleModule[] {
  return RULE_REGISTRY.filter((rule) => rule.stage === stage);
}
