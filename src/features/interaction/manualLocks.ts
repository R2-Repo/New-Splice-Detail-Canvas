import type { GridPoint } from "@/features/grid/coords";
import type { LaneSegment } from "@/features/grid/laneBook";
import type { DiagramSide } from "@/features/diagram/types";

export type ManualLockObjectType =
  | "cable"
  | "bufferTube"
  | "fanout"
  | "strandLane"
  | "spliceDot"
  | "label"
  | "bundle";

export type CableLockGeometry = GridPoint & { side: DiagramSide };

export type ManualLockGeometry = GridPoint | LaneSegment | CableLockGeometry;

export type ManualLock = {
  lockId: string;
  objectType: ManualLockObjectType;
  objectId: string;
  lockedGeometry: ManualLockGeometry;
  createdAt: string;
};

export function createLockId(objectType: ManualLockObjectType, objectId: string): string {
  return `${objectType}:${objectId}`;
}

export function createManualLock(
  objectType: ManualLockObjectType,
  objectId: string,
  lockedGeometry: ManualLockGeometry,
): ManualLock {
  return {
    lockId: createLockId(objectType, objectId),
    objectType,
    objectId,
    lockedGeometry,
    createdAt: new Date().toISOString(),
  };
}

export function upsertManualLock(locks: ManualLock[], lock: ManualLock): ManualLock[] {
  const rest = locks.filter((l) => l.lockId !== lock.lockId);
  return [...rest, lock];
}

export function removeManualLock(locks: ManualLock[], lockId: string): ManualLock[] {
  return locks.filter((l) => l.lockId !== lockId);
}

export function removeLocksForObjects(locks: ManualLock[], objectIds: Set<string>): ManualLock[] {
  return locks.filter((l) => !objectIds.has(l.objectId) && !objectIds.has(l.lockId));
}

export function getLockForObject(locks: ManualLock[], objectType: ManualLockObjectType, objectId: string): ManualLock | undefined {
  const lockId = createLockId(objectType, objectId);
  return locks.find((l) => l.lockId === lockId);
}

export function isObjectLocked(locks: ManualLock[], objectType: ManualLockObjectType, objectId: string): boolean {
  return getLockForObject(locks, objectType, objectId) !== undefined;
}

export function isCableLockGeometry(geometry: ManualLockGeometry): geometry is CableLockGeometry {
  return "side" in geometry && typeof geometry.side === "string";
}

export function isLaneSegmentGeometry(geometry: ManualLockGeometry): geometry is LaneSegment {
  return "orientation" in geometry && "track" in geometry;
}

export function isGridPointGeometry(geometry: ManualLockGeometry): geometry is GridPoint {
  return "col" in geometry && "row" in geometry && !("orientation" in geometry) && !("side" in geometry);
}

export function filterLocksByType(locks: ManualLock[], objectType: ManualLockObjectType): ManualLock[] {
  return locks.filter((l) => l.objectType === objectType);
}

/** Preserve locks whose object ids still exist after re-import. */
export function preserveLocksAfterImport(
  locks: ManualLock[],
  validObjectIds: Set<string>,
): ManualLock[] {
  return locks.filter((lock) => validObjectIds.has(lock.objectId));
}

export function validLockObjectIds(graph: import("@/features/diagram/types").ConnectionGraph): Set<string> {
  const ids = new Set<string>();
  for (const leg of graph.legs) ids.add(leg.id);
  for (const conn of graph.connections) ids.add(conn.id);
  for (const tube of graph.tubes) ids.add(`${tube.legId}::${tube.tubeColor}`);
  return ids;
}
