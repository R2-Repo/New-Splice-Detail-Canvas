import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";
import {
  meetsBendClearance,
  routeGridPoints,
  routeInsideHorizontalZone,
} from "../../routing/routeValidation";

export const sdcRoute001: RuleModule = {
  id: ruleId("sdc-route-001"),
  title: "Fiber Strand Routing Zone",
  stage: "routing",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const { routing, layout } = snapshot;
    if (layout.zoneLayout.mode !== "horizontal") return [];

    const zone = layout.zoneLayout.horizontal;
    const violations: RuleViolation[] = [];

    for (const route of routing.routes) {
      if (route.routeError) continue;
      const points = routeGridPoints(route);
      if (points.length === 0) continue;

      if (!routeInsideHorizontalZone(points, zone)) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-001"),
          severity: "error",
          message: `Connection ${route.connectionId} leaves the center routing zone.`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Reroute inside the center routing grid between fanout exits and fusion dots.",
        });
      }

      if (!meetsBendClearance(points, zone, layout.fanoutExits)) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-001"),
          severity: "warning",
          message: `Connection ${route.connectionId} bends closer than ${SDC_DEFAULTS.spacing.minBendClearancePx}px from the fanout edge.`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Move the first bend farther into the routing zone.",
        });
      }
    }

    return violations;
  },
};
