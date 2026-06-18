/**
 * Grid lane segment status model (SDC-GRID-001).
 *
 * Canonical vocabulary for the grid rebuild. `LaneBook` currently tracks only
 * booked (occupied) segments; the routing rebuild will adopt these statuses.
 */
export type GridSegmentStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "blocked"
  | "manual-locked";

export const GRID_SEGMENT_STATUSES: readonly GridSegmentStatus[] = [
  "available",
  "reserved",
  "occupied",
  "blocked",
  "manual-locked",
];

/** A segment that an unrelated route may not use. */
export function isBlockingStatus(status: GridSegmentStatus): boolean {
  return status === "occupied" || status === "blocked" || status === "manual-locked";
}
