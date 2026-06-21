import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";
import {
  countSegmentCrossings,
  gridPointsToSegments,
  parseSvgPath,
} from "../../routing/scoreRouting";
import { routeGridPoints } from "../../routing/routeValidation";

export const sdcRoute003: RuleModule = {
  id: ruleId("sdc-route-003"),
  title: "Fiber Strand Overlap, Crossing, and Collision",
  stage: "routing",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const { routing } = snapshot;
    const violations: RuleViolation[] = [];
    const allSegments = routing.routes
      .filter((r) => !r.routeError && r.path)
      .map((r) => {
        const points = routeGridPoints(r);
        return points.length >= 2 ? gridPointsToSegments(points) : parseSvgPath(r.path);
      });

    const crossings = countSegmentCrossings(allSegments);
    if (crossings > 0) {
      violations.push({
        ruleId: ruleId("SDC-ROUTE-003"),
        severity: "warning",
        message: `${crossings} route crossing(s) detected between unrelated strand segments.`,
        objectType: "fiberRoute",
        objectIds: [],
        suggestedFix: "Separate vertical bus lanes or reorder routing to reduce crossings.",
      });
    }

    for (const seg of routing.laneBook.allSegments) {
      if (seg.status !== "occupied") continue;
      const overlaps = routing.laneBook.allSegments.filter(
        (other) =>
          other !== seg &&
          other.status === "occupied" &&
          other.orientation === seg.orientation &&
          other.track === seg.track &&
          other.spanStart < seg.spanEnd &&
          seg.spanStart < other.spanEnd &&
          other.owner !== seg.owner,
      );
      if (overlaps.length > 0) {
        violations.push({
          ruleId: ruleId("SDC-ROUTE-003"),
          severity: "error",
          message: `Shared occupied lane on ${seg.orientation} track ${seg.track} between unrelated routes.`,
          objectType: "gridLane",
          objectIds: [seg.owner ?? "unknown"],
          suggestedFix: "Allocate distinct vertical or horizontal lanes per strand group.",
        });
      }
    }

    return violations;
  },
};
