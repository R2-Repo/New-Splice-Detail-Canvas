import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";
import {
  countRouteBends,
  isOrthogonalPath,
  routeGridPoints,
} from "../../routing/routeValidation";

export const sdcRoute004: RuleModule = {
  id: ruleId("sdc-route-004"),
  title: "Orthogonal Path Geometry and Bend Limits",
  stage: "routing",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const { routing } = snapshot;
    const violations: RuleViolation[] = [];

    for (const route of routing.routes) {
      if (route.routeError) continue;
      const points = routeGridPoints(route);
      if (points.length === 0) continue;

      if (!isOrthogonalPath(points)) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-004"),
          severity: "error",
          message: `Connection ${route.connectionId} contains a non-orthogonal segment.`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Use horizontal and vertical grid segments only.",
        });
      }

      const bends = route.bendCount ?? countRouteBends(points);
      if (bends > SDC_DEFAULTS.bends.hardMax) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-004"),
          severity: "error",
          message: `Connection ${route.connectionId} has ${bends} bends (hard max ${SDC_DEFAULTS.bends.hardMax}).`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Simplify the route geometry.",
        });
      } else if (bends > SDC_DEFAULTS.bends.preferredMaxTwoSided) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-004"),
          severity: "warning",
          message: `Connection ${route.connectionId} exceeds preferred bend count (${bends} > ${SDC_DEFAULTS.bends.preferredMaxTwoSided}).`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Reduce bends where possible.",
        });
      }
    }

    return violations;
  },
};
