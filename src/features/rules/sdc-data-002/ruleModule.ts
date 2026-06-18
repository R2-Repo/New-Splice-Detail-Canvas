import { messagesForRule } from "../sdcValidation";
import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

/**
 * SDC-DATA-002 — buffer tube count.
 * Validates absolute fiber numbers and the inferred 6/12 count. Does NOT require
 * full tube population: Bentley CSVs only list spliced fibers. Low-confidence
 * inference surfaces as a warning (forwarded from normalization).
 */
export const sdcData002: RuleModule = {
  id: ruleId("sdc-data-002"),
  title: "Buffer Tube Count",
  stage: "data",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const normalized = snapshot.normalizedImport;
    if (!normalized) return [];

    const violations: RuleViolation[] = [];

    for (const fiber of normalized.fiberStrands) {
      if (!Number.isInteger(fiber.absoluteFiberNumber) || fiber.absoluteFiberNumber <= 0) {
        violations.push({
          ruleId: ruleId("SDC-DATA-002"),
          severity: "error",
          message: `Fiber ${fiber.fiberId} has invalid absolute number ${fiber.absoluteFiberNumber}.`,
          objectType: "fiberStrand",
          objectIds: [fiber.fiberId],
          sourceRows: fiber.sourceRows,
          suggestedFix: "Absolute fiber strand numbers must be positive integers.",
        });
      }
    }

    for (const cable of normalized.cables) {
      if (cable.fibersPerTube !== 6 && cable.fibersPerTube !== 12) {
        violations.push({
          ruleId: ruleId("SDC-DATA-002"),
          severity: "error",
          message: `Cable ${cable.cableId} has an invalid buffer tube count ${cable.fibersPerTube}.`,
          objectType: "fiberCable",
          objectIds: [cable.cableId],
          suggestedFix: "Buffer tube count must be 6 or 12.",
        });
      }
    }

    // Low-confidence inference warnings are produced during normalization.
    violations.push(
      ...messagesForRule([...normalized.errors, ...normalized.warnings], "SDC-DATA-002"),
    );

    return violations;
  },
};
