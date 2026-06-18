import { messagesForRule } from "../sdcValidation";
import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

/**
 * SDC-CONNECT-001 — fusion splice dot and connection pairing.
 * One fusion dot per pair, both endpoints resolve to known fibers, and
 * duplicate/identical-endpoint problems are reported (forwarded from normalization).
 */
export const sdcConnect001: RuleModule = {
  id: ruleId("sdc-connect-001"),
  title: "Fusion Splice Dot and Connection Pairing",
  stage: "data",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const normalized = snapshot.normalizedImport;
    if (!normalized) return [];

    const violations: RuleViolation[] = [];
    const fiberIds = new Set(normalized.fiberStrands.map((fiber) => fiber.fiberId));

    if (normalized.fusionSpliceDots.length !== normalized.connectionPairs.length) {
      violations.push({
        ruleId: ruleId("SDC-CONNECT-001"),
        severity: "error",
        message: `Expected one fusion splice dot per connection pair (${normalized.connectionPairs.length} pairs, ${normalized.fusionSpliceDots.length} dots).`,
        objectType: "fusionSpliceDot",
        objectIds: [],
        suggestedFix: "Each connection pair must create exactly one fusion splice dot.",
      });
    }

    for (const pair of normalized.connectionPairs) {
      if (!fiberIds.has(pair.endpointA.fiberId)) {
        violations.push(endpointError(pair.connectionId, "A", pair.endpointA.fiberId));
      }
      if (!fiberIds.has(pair.endpointB.fiberId)) {
        violations.push(endpointError(pair.connectionId, "B", pair.endpointB.fiberId));
      }
    }

    // Identical-endpoint errors and duplicate-dot warnings come from normalization.
    violations.push(
      ...messagesForRule([...normalized.errors, ...normalized.warnings], "SDC-CONNECT-001"),
    );

    return violations;
  },
};

function endpointError(connectionId: string, side: "A" | "B", fiberId: string): RuleViolation {
  return {
    ruleId: ruleId("SDC-CONNECT-001"),
    severity: "error",
    message: `Connection ${connectionId} endpoint ${side} references unknown fiber ${fiberId}.`,
    objectType: "connectionPair",
    objectIds: [connectionId],
    suggestedFix: "Both endpoints must map to a known fiber strand.",
  };
}
