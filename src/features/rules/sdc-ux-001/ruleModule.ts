import {
  isCableLockGeometry,
  isGridPointGeometry,
  isLaneSegmentGeometry,
} from "@/features/interaction/manualLocks";

import type { DiagramSnapshot, RuleModule, RuleViolation } from "../types";
import { ruleId } from "../types";

function placementForNode(snapshot: DiagramSnapshot, nodeId: string) {
  return snapshot.layout.placements.find((p) => p.nodeId === nodeId);
}

/**
 * SDC-UX-001 — auto layout and manual locks.
 */
export const sdcUx001: RuleModule = {
  id: ruleId("sdc-ux-001"),
  title: "Auto Layout and Manual Locks",
  stage: "full",
  check(snapshot: DiagramSnapshot): RuleViolation[] {
    const locks = snapshot.manualLocks ?? [];
    if (locks.length === 0) return [];

    const violations: RuleViolation[] = [];

    for (const lock of locks) {
      if (lock.objectType === "cable" && isCableLockGeometry(lock.lockedGeometry)) {
        const placement = placementForNode(snapshot, `cable-${lock.objectId}`);
        if (!placement) continue;
        if (placement.col !== lock.lockedGeometry.col || placement.row !== lock.lockedGeometry.row) {
          violations.push({
            ruleId: ruleId("SDC-UX-001"),
            severity: "error",
            message: `Locked cable ${lock.objectId} moved during auto layout (${placement.col},${placement.row} vs lock ${lock.lockedGeometry.col},${lock.lockedGeometry.row}).`,
            objectType: "manualLock",
            objectIds: [lock.lockId],
            suggestedFix: "Unlock the cable or rerun layout without moving locked items.",
          });
        }
      }

      if (lock.objectType === "spliceDot" && isGridPointGeometry(lock.lockedGeometry)) {
        const placement = placementForNode(snapshot, `splice-${lock.objectId}`);
        if (!placement) continue;
        if (placement.col !== lock.lockedGeometry.col || placement.row !== lock.lockedGeometry.row) {
          violations.push({
            ruleId: ruleId("SDC-UX-001"),
            severity: "error",
            message: `Locked splice dot ${lock.objectId} moved during auto layout.`,
            objectType: "manualLock",
            objectIds: [lock.lockId],
            suggestedFix: "Unlock the splice dot before rerunning layout.",
          });
        }
      }

      if (lock.objectType === "strandLane" && isLaneSegmentGeometry(lock.lockedGeometry)) {
        const midCol = snapshot.layout.connectionMidCols.get(lock.objectId);
        if (midCol !== undefined && midCol !== lock.lockedGeometry.track) {
          violations.push({
            ruleId: ruleId("SDC-UX-001"),
            severity: "error",
            message: `Locked strand lane for ${lock.objectId} was rerouted to column ${midCol} instead of ${lock.lockedGeometry.track}.`,
            objectType: "manualLock",
            objectIds: [lock.lockId],
            suggestedFix: "Unlock the strand lane or free adjacent routing columns.",
          });
        }
      }
    }

    for (const route of snapshot.routing.routes) {
      if (!route.routeError) continue;
      const lockBlocksRoute = locks.some(
        (l) =>
          (l.objectType === "strandLane" && l.objectId === route.connectionId) ||
          (l.objectType === "spliceDot" && l.objectId === route.connectionId),
      );
      if (lockBlocksRoute) {
        violations.push({
          ruleId: ruleId("SDC-UX-001"),
          severity: "warning",
          message: `Locked adjustment may block clean routing for ${route.connectionId}: ${route.routeError}.`,
          objectType: "manualLock",
          objectIds: [route.connectionId],
          suggestedFix: "Unlock related items or adjust locked positions.",
        });
      }
    }

    return violations;
  },
};
