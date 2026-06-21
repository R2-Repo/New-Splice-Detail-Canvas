import type { ConnectionGraph } from "@/features/diagram/types";
import type { GridPoint } from "@/features/grid/coords";
import type { LayoutResult } from "@/features/layout/types";

import {
  filterLocksByType,
  isCableLockGeometry,
  isGridPointGeometry,
  isLaneSegmentGeometry,
  type ManualLock,
} from "./manualLocks";

const LEFT_FANOUT_COL = 10;
const RIGHT_FANOUT_COL = 46;

function findPlacement(layout: LayoutResult, nodeId: string) {
  return layout.placements.find((p) => p.nodeId === nodeId);
}

function setPlacement(layout: LayoutResult, nodeId: string, col: number, row: number): void {
  const placement = findPlacement(layout, nodeId);
  if (placement) {
    placement.col = col;
    placement.row = row;
    return;
  }
  layout.placements.push({ nodeId, col, row });
}

function updateSpliceRow(layout: LayoutResult, connId: string, row: number, col?: number): void {
  setPlacement(layout, `splice-${connId}`, col ?? layout.placements.find((p) => p.nodeId === `splice-${connId}`)?.col ?? 28, row);
  layout.connectionRows.set(connId, row);
  const sp = layout.splicePoints.find((s) => s.connectionId === connId);
  if (sp) sp.point = { col: sp.point.col, row };
}

function applyCableLock(
  layout: LayoutResult,
  graph: ConnectionGraph,
  lock: ManualLock,
): void {
  if (!isCableLockGeometry(lock.lockedGeometry)) return;

  const legId = lock.objectId;
  const { col, row, side } = lock.lockedGeometry;
  const cableNodeId = `cable-${legId}`;
  const autoCable = findPlacement(layout, cableNodeId);
  if (!autoCable) return;

  const rowDelta = row - autoCable.row;
  const leg = graph.legs.find((l) => l.id === legId);
  const previousSide = leg?.side;
  if (leg) leg.side = side;

  if (previousSide && previousSide !== side) {
    const fanoutCol = side === "right" ? RIGHT_FANOUT_COL : LEFT_FANOUT_COL;
    for (const fiber of graph.fibers.filter((f) => f.legId === legId)) {
      const fiberPlacement = findPlacement(layout, `fiber-${fiber.id}`);
      if (fiberPlacement) fiberPlacement.col = fanoutCol;
      layout.fanoutExits.set(fiber.id, fanoutCol);
    }
  }

  for (const fiber of graph.fibers.filter((f) => f.legId === legId)) {
    const fiberPlacement = findPlacement(layout, `fiber-${fiber.id}`);
    if (fiberPlacement) {
      fiberPlacement.row += rowDelta;
    }
  }

  setPlacement(layout, cableNodeId, col, row);

  for (const conn of graph.connections) {
    if (conn.fromLegId === legId) {
      const fiberRow = findPlacement(layout, `fiber-${conn.fromFiberId}`)?.row;
      if (fiberRow !== undefined) updateSpliceRow(layout, conn.id, fiberRow);
    } else if (conn.toLegId === legId) {
      const fiberRow = findPlacement(layout, `fiber-${conn.toFiberId}`)?.row;
      if (fiberRow !== undefined) updateSpliceRow(layout, conn.id, fiberRow);
    }
  }
}

function applySpliceDotLock(layout: LayoutResult, lock: ManualLock): void {
  if (!isGridPointGeometry(lock.lockedGeometry)) return;
  const connId = lock.objectId;
  const { col, row } = lock.lockedGeometry;
  setPlacement(layout, `splice-${connId}`, col, row);
  layout.connectionRows.set(connId, row);
  const sp = layout.splicePoints.find((s) => s.connectionId === connId);
  if (sp) sp.point = { col, row };
}

function applyStrandLaneLock(layout: LayoutResult, lock: ManualLock): void {
  if (!isLaneSegmentGeometry(lock.lockedGeometry)) return;
  if (lock.lockedGeometry.orientation !== "vertical") return;
  layout.connectionMidCols.set(lock.objectId, lock.lockedGeometry.track);
}

function applyFanoutLock(
  layout: LayoutResult,
  graph: ConnectionGraph,
  lock: ManualLock,
): void {
  if (!isGridPointGeometry(lock.lockedGeometry)) return;
  const tubeId = lock.objectId;
  const [legId, tubeColor] = tubeId.split("::");
  if (!legId || !tubeColor) return;

  for (const fiber of graph.fibers.filter((f) => f.legId === legId && f.tubeColor === tubeColor)) {
    layout.fanoutExits.set(fiber.id, lock.lockedGeometry.col);
    const fiberPlacement = findPlacement(layout, `fiber-${fiber.id}`);
    if (fiberPlacement) fiberPlacement.col = lock.lockedGeometry.col;
  }
}

/** Apply manual locks onto a freshly computed layout (SDC-UX-001). */
export function applyLocksToLayout(
  layout: LayoutResult,
  graph: ConnectionGraph,
  locks: ManualLock[],
): LayoutResult {
  if (locks.length === 0) return layout;

  const next: LayoutResult = {
    ...layout,
    placements: layout.placements.map((p) => ({ ...p })),
    splicePoints: layout.splicePoints.map((s) => ({ ...s, point: { ...s.point } })),
    groupLanes: new Map(layout.groupLanes),
    connectionRows: new Map(layout.connectionRows),
    fanoutExits: new Map(layout.fanoutExits),
    connectionMidCols: new Map(layout.connectionMidCols),
    zoneLayout: layout.zoneLayout,
  };

  for (const lock of filterLocksByType(locks, "cable")) {
    applyCableLock(next, graph, lock);
  }
  for (const lock of filterLocksByType(locks, "spliceDot")) {
    applySpliceDotLock(next, lock);
  }
  for (const lock of filterLocksByType(locks, "strandLane")) {
    applyStrandLaneLock(next, lock);
  }
  for (const lock of filterLocksByType(locks, "fanout")) {
    applyFanoutLock(next, graph, lock);
  }
  for (const lock of filterLocksByType(locks, "bufferTube")) {
    applyFanoutLock(next, graph, lock);
  }

  return next;
}

export function lockedGridPointForNode(
  locks: ManualLock[],
  nodeId: string,
): GridPoint | undefined {
  if (nodeId.startsWith("cable-")) {
    const lock = locks.find((l) => l.objectType === "cable" && l.objectId === nodeId.slice(6));
    if (lock && isCableLockGeometry(lock.lockedGeometry)) {
      return { col: lock.lockedGeometry.col, row: lock.lockedGeometry.row };
    }
  }
  if (nodeId.startsWith("splice-")) {
    const lock = locks.find((l) => l.objectType === "spliceDot" && l.objectId === nodeId.slice(7));
    if (lock && isGridPointGeometry(lock.lockedGeometry)) return lock.lockedGeometry;
  }
  return undefined;
}
