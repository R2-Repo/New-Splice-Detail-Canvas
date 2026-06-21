import { classifyStrandGroups } from "@/features/diagram/strandGroups";

import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";
import { midTracksByConnection } from "../../routing/routeValidation";

export const sdcRoute002: RuleModule = {
  id: ruleId("sdc-route-002"),
  title: "Fiber Strand Nesting",
  stage: "routing",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const { routing, layout, connectionGraph } = snapshot;
    if (layout.layoutMode !== "horizontal") return [];

    const strandInput = classifyStrandGroups(connectionGraph);
    const midByConn = midTracksByConnection(routing.routes);
    const violations: RuleViolation[] = [];

    for (const group of strandInput.groups) {
      if (group.kind !== "destTube") continue;
      const mids = group.connectionIds
        .map((id) => midByConn.get(id))
        .filter((v): v is number => v !== undefined);
      if (mids.length === 0) continue;

      const preferred = group.connectionIds
        .map((id) => layout.connectionMidCols.get(id))
        .filter((v): v is number => v !== undefined);

      const unique = [...new Set(mids)].sort((a, b) => a - b);
      for (let i = 1; i < unique.length; i += 1) {
        if (unique[i]! - unique[i - 1]! > 1) {
          violations.push({
            ruleId: ruleId("SDC-ROUTE-002"),
            severity: "error",
            message: `Buffer tube group ${group.label} uses non-adjacent mid columns (${unique.join(", ")}).`,
            objectType: "strandGroup",
            objectIds: [group.id],
            suggestedFix: "Assign adjacent vertical lanes for strands in the same buffer tube.",
          });
          break;
        }
      }

      for (let i = 0; i < group.connectionIds.length; i += 1) {
        const connId = group.connectionIds[i]!;
        const mid = midByConn.get(connId);
        const pref = layout.connectionMidCols.get(connId) ?? preferred[i];
        if (mid !== undefined && pref !== undefined && Math.abs(mid - pref) > 0) {
          violations.push({
            ruleId: ruleId("SDC-ROUTE-002"),
            severity: "warning",
            message: `Connection ${connId} uses mid column ${mid} instead of preferred ${pref}.`,
            objectType: "strandGroup",
            objectIds: [connId],
            suggestedFix: "Keep same-buffer-tube strands on adjacent lanes.",
          });
        }
      }
    }

    return violations;
  },
};
