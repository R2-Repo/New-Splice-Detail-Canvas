import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

/**
 * SDC-DATA-001 — fiber optic cable hierarchy.
 * Every fiber traces to exactly one buffer tube and one cable; no orphans,
 * duplicate ids, or empty containers.
 */
export const sdcData001: RuleModule = {
  id: ruleId("sdc-data-001"),
  title: "Fiber Optic Cable Hierarchy",
  stage: "data",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const normalized = snapshot.normalizedImport;
    if (!normalized) return [];

    const violations: RuleViolation[] = [];
    const cableIds = new Set(normalized.cables.map((cable) => cable.cableId));
    const tubeIds = new Set(normalized.bufferTubes.map((tube) => tube.tubeId));

    const seenFiberIds = new Set<string>();
    const tubesWithFibers = new Set<string>();
    const cablesWithTubes = new Set<string>();

    for (const fiber of normalized.fiberStrands) {
      if (seenFiberIds.has(fiber.fiberId)) {
        violations.push(error(`Duplicate fiber id ${fiber.fiberId}.`, "fiberStrand", fiber.fiberId));
      }
      seenFiberIds.add(fiber.fiberId);
      tubesWithFibers.add(fiber.tubeId);

      if (!tubeIds.has(fiber.tubeId)) {
        violations.push(
          error(`Fiber ${fiber.fiberId} has no parent buffer tube.`, "fiberStrand", fiber.fiberId),
        );
      }
      if (!cableIds.has(fiber.cableId)) {
        violations.push(
          error(`Fiber ${fiber.fiberId} has no parent cable.`, "fiberStrand", fiber.fiberId),
        );
      }
    }

    for (const tube of normalized.bufferTubes) {
      cablesWithTubes.add(tube.cableId);
      if (!cableIds.has(tube.cableId)) {
        violations.push(error(`Buffer tube ${tube.tubeId} has no parent cable.`, "bufferTube", tube.tubeId));
      }
      if (!tubesWithFibers.has(tube.tubeId)) {
        violations.push(error(`Buffer tube ${tube.tubeId} contains no fiber strands.`, "bufferTube", tube.tubeId));
      }
    }

    for (const cable of normalized.cables) {
      if (!cablesWithTubes.has(cable.cableId)) {
        violations.push(error(`Cable ${cable.cableId} contains no buffer tubes.`, "fiberCable", cable.cableId));
      }
    }

    return violations;
  },
};

function error(message: string, objectType: string, objectId: string): RuleViolation {
  return {
    ruleId: ruleId("SDC-DATA-001"),
    severity: "error",
    message,
    objectType,
    objectIds: [objectId],
    suggestedFix: "Check CSV parsing and the normalized cable hierarchy.",
  };
}
