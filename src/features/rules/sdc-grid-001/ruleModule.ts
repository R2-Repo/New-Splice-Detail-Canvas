import type { BookedLaneSegment, LaneSegment } from "@/features/grid/laneBook";

import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

/**
 * SDC-GRID-001 — canvas grid system (routing-output integrity + segment status).
 */
export const sdcGrid001: RuleModule = {
  id: ruleId("sdc-grid-001"),
  title: "Canvas Grid System",
  stage: "routing",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const { routing, connectionGraph } = snapshot;
    const violations: RuleViolation[] = [];

    if (routing.routes.length !== connectionGraph.connections.length) {
      violations.push({
        ruleId: ruleId("SDC-GRID-001"),
        severity: "error",
        message: `Route count (${routing.routes.length}) does not match connection count (${connectionGraph.connections.length}).`,
        objectType: "fiberRoute",
        objectIds: [],
        suggestedFix: "Every connection must produce exactly one route entry.",
      });
    }

    for (const route of routing.routes) {
      if (route.routeError) {
        violations.push({
          ruleId: ruleId("SDC-GRID-001"),
          severity: "warning",
          message: `Connection ${route.connectionId} could not be cleanly routed: ${route.routeError}.`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "Retry layout or free up routing lanes.",
        });
        continue;
      }
      if (route.path.trim() === "") {
        violations.push({
          ruleId: ruleId("SDC-GRID-001"),
          severity: "error",
          message: `Connection ${route.connectionId} has no path and no route error.`,
          objectType: "fiberRoute",
          objectIds: [route.connectionId],
          suggestedFix: "A routed connection must produce grid segments or report an error.",
        });
      }

      for (const seg of route.laneSegments ?? []) {
        if (segmentCrossesBlocked(seg, routing.laneBook.allSegments)) {
          violations.push({
            ruleId: ruleId("SDC-GRID-001"),
            severity: "error",
            message: `Connection ${route.connectionId} uses a lane segment blocked by reserved layout space.`,
            objectType: "fiberRoute",
            objectIds: [route.connectionId],
            suggestedFix: "Reroute around cable, fanout, or label reserved areas.",
          });
          break;
        }
      }
    }

    for (const overlap of findLaneOverlaps(routing.laneBook.booked)) {
      violations.push({
        ruleId: ruleId("SDC-GRID-001"),
        severity: "error",
        message: `Two booked lane segments overlap on ${overlap.orientation} track ${overlap.track}.`,
        objectType: "gridLane",
        objectIds: [`${overlap.orientation}:${overlap.track}`],
        suggestedFix: "Unrelated routes must not share an occupied lane segment.",
      });
    }

    return violations;
  },
};

function spansOverlap(a: LaneSegment, b: LaneSegment): boolean {
  if (a.orientation !== b.orientation || a.track !== b.track) return false;
  return a.spanStart < b.spanEnd && b.spanStart < a.spanEnd;
}

function segmentCrossesBlocked(
  segment: LaneSegment,
  all: readonly BookedLaneSegment[],
): boolean {
  for (const existing of all) {
    if (existing.status !== "blocked" && existing.status !== "manual-locked") continue;
    if (spansOverlap(segment, existing)) return true;
  }
  return false;
}

function findLaneOverlaps(segments: readonly LaneSegment[]): LaneSegment[] {
  const overlaps: LaneSegment[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i]!;
      const b = segments[j]!;
      if (a.orientation !== b.orientation || a.track !== b.track) continue;
      if (a.spanStart < b.spanEnd && b.spanStart < a.spanEnd) {
        overlaps.push(a);
      }
    }
  }
  return overlaps;
}
