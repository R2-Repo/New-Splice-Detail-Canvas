import { sdcConnect001 } from "./sdc-connect-001/ruleModule";
import { sdcData001 } from "./sdc-data-001/ruleModule";
import { sdcData002 } from "./sdc-data-002/ruleModule";
import { sdcGrid001 } from "./sdc-grid-001/ruleModule";
import { sdcImport001 } from "./sdc-import-001/ruleModule";
import { sdcRoute001 } from "./sdc-route-001/ruleModule";
import { sdcRoute002 } from "./sdc-route-002/ruleModule";
import { sdcRoute003 } from "./sdc-route-003/ruleModule";
import { sdcRoute004 } from "./sdc-route-004/ruleModule";
import { sdcUx001 } from "./sdc-ux-001/ruleModule";
import type { RuleId, RuleModule, RuleStage } from "./types";

/** Active rule modules in pipeline order (SDC rule pack). */
export const RULE_REGISTRY: RuleModule[] = [
  sdcImport001,
  sdcData001,
  sdcData002,
  sdcConnect001,
  sdcGrid001,
  sdcRoute001,
  sdcRoute002,
  sdcRoute003,
  sdcRoute004,
  sdcUx001,
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
