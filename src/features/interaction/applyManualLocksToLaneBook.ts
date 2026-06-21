import type { LaneBook } from "@/features/grid/laneBook";
import type { LayoutResult } from "@/features/layout/types";

import { filterLocksByType, isLaneSegmentGeometry, type ManualLock } from "./manualLocks";

/** Seed manual-locked lane segments before routing unlocked strands (SDC-GRID-001). */
export function applyManualLocksToLaneBook(
  laneBook: LaneBook,
  locks: ManualLock[],
  layout: LayoutResult,
): void {
  for (const lock of filterLocksByType(locks, "strandLane")) {
    if (!isLaneSegmentGeometry(lock.lockedGeometry)) continue;
    laneBook.tryReserve(lock.lockedGeometry, "manual-locked", lock.lockId);
  }

  for (const lock of filterLocksByType(locks, "spliceDot")) {
    const connId = lock.objectId;
    const row = layout.connectionRows.get(connId);
    const midCol = layout.connectionMidCols.get(connId);
    if (row === undefined || midCol === undefined) continue;
    laneBook.tryReserve(
      { orientation: "vertical", track: midCol, spanStart: row - 1, spanEnd: row + 1 },
      "manual-locked",
      lock.lockId,
    );
  }
}
