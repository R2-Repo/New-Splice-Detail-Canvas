import { sdcConnect001 } from "./sdc-connect-001/ruleModule";
import { sdcData001 } from "./sdc-data-001/ruleModule";
import { sdcData002 } from "./sdc-data-002/ruleModule";
import { sdcGrid001 } from "./sdc-grid-001/ruleModule";
import { sdcImport001 } from "./sdc-import-001/ruleModule";
import type { RuleId, RuleModule, RuleStage } from "./types";

/** Active rule modules in pipeline order (SDC rule pack). */
export const RULE_REGISTRY: RuleModule[] = [
  sdcImport001,
  sdcData001,
  sdcData002,
  sdcConnect001,
  sdcGrid001,
];

export function listRules(): readonly RuleModule[] {
  return RULE_REGISTRY;
}

export function getRule(id: RuleId): RuleModule | undefined {
  return RULE_REGISTRY.find((rule) => rule.id === id);
}

export function rulesByStage(stage: RuleStage): RuleModule[] {
  return RULE_REGISTRY.filter((rule) => rule.stage === stage);
}
