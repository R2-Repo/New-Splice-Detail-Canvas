import type { ImportMessage } from "@/features/import/normalize";

import { ruleId, type RuleViolation } from "./types";

/** Convert a normalized-import message into a rule violation (SDC-VALIDATE-001). */
export function messageToViolation(message: ImportMessage): RuleViolation {
  return {
    ruleId: ruleId(message.ruleId),
    message: message.message,
    severity: message.severity,
    objectIds: message.objectIds,
    sourceRows: message.sourceRows,
    suggestedFix: message.suggestedFix,
  };
}

/** Forward all normalized messages tagged with a given SDC rule id. */
export function messagesForRule(messages: ImportMessage[], sdcRuleId: string): RuleViolation[] {
  return messages
    .filter((message) => message.ruleId === sdcRuleId)
    .map(messageToViolation);
}
