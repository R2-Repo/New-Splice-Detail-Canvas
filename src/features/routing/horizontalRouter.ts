import { gridToPx, type GridPoint } from "@/features/grid/coords";
import { bendClearanceCols } from "@/features/grid/gridOccupancy";
import { LaneBook, type LaneSegment } from "@/features/grid/laneBook";
import type { HorizontalZoneLayout } from "@/features/grid/zones";

export type StructuredRoute = {
  path: string;
  gridPoints: GridPoint[];
  laneSegments: LaneSegment[];
  midTrack?: number;
  routeError?: string;
  bendCount: number;
};

function normalizeSpan(a: number, b: number): { start: number; end: number } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

function bookSegment(
  laneBook: LaneBook,
  orientation: "horizontal" | "vertical",
  track: number,
  a: number,
  b: number,
  owner: string,
): LaneSegment | null {
  const { start, end } = normalizeSpan(a, b);
  const segment: LaneSegment = { orientation, track, spanStart: start, spanEnd: end };
  if (!laneBook.tryBook(segment, owner)) return null;
  return segment;
}

/** Book or reuse an already-occupied horizontal span (shared straight bus). */
function bookSharedHorizontal(
  laneBook: LaneBook,
  track: number,
  a: number,
  b: number,
  owner: string,
): LaneSegment | null {
  const { start, end } = normalizeSpan(a, b);
  const segment: LaneSegment = { orientation: "horizontal", track, spanStart: start, spanEnd: end };
  if (laneBook.tryBook(segment, owner)) return segment;

  for (const existing of laneBook.allSegments) {
    if (existing.orientation !== "horizontal" || existing.track !== track) continue;
    if (existing.status !== "occupied" && existing.status !== "manual-locked") continue;
    if (existing.spanStart <= segment.spanStart && existing.spanEnd >= segment.spanEnd) {
      return segment;
    }
    // Same-row straight bus: overlapping occupied span is shared infrastructure.
    if (segment.spanStart < existing.spanEnd && existing.spanStart < segment.spanEnd) {
      return segment;
    }
  }
  return null;
}

function dedupePoints(points: GridPoint[]): GridPoint[] {
  const out: GridPoint[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.col === p.col && last.row === p.row) continue;
    out.push(p);
  }
  return out;
}

function countGridBends(points: GridPoint[]): number {
  if (points.length < 3) return 0;
  let bends = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const next = points[i + 1]!;
    const inHoriz = prev.row === cur.row;
    const outHoriz = cur.row === next.row;
    if (inHoriz !== outHoriz) bends += 1;
  }
  return bends;
}

const CORNER_RADIUS = 8;

function towards(
  from: { x: number; y: number },
  to: { x: number; y: number },
  r: number,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const rr = Math.min(r, len / 2);
  return { x: from.x + (dx / len) * rr, y: from.y + (dy / len) * rr };
}

/** Orthogonal polyline with rounded corners (cosmetic bevels; bend points stay on grid). */
export function gridPointsToPath(points: GridPoint[]): string {
  const pts = points.map((p) => ({ x: gridToPx(p.col), y: gridToPx(p.row) }));
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }

  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const cur = pts[i]!;
    const a = towards(cur, pts[i - 1]!, CORNER_RADIUS);
    const b = towards(cur, pts[i + 1]!, CORNER_RADIUS);
    d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function allocateMidColumn(
  laneBook: LaneBook,
  rowStart: number,
  rowEnd: number,
  zone: HorizontalZoneLayout,
  preferred?: number,
): number | null {
  const candidates: number[] = [];
  if (preferred !== undefined) candidates.push(preferred);
  for (let col = zone.centerStartCol; col <= zone.centerEndCol; col += 1) {
    if (col === preferred) continue;
    candidates.push(col);
  }

  for (const col of candidates) {
    if (laneBook.conflicts({ orientation: "vertical", track: col, spanStart: rowStart, spanEnd: rowEnd })) {
      continue;
    }
    return col;
  }
  return null;
}

/**
 * Route one horizontal-layout connection: left fanout exit -> fusion dot -> right fanout exit.
 * Books all segments in LaneBook (SDC-ROUTE-004).
 */
export function routeHorizontalConnection(
  leftExit: GridPoint,
  splice: GridPoint,
  rightExit: GridPoint,
  zone: HorizontalZoneLayout,
  laneBook: LaneBook,
  preferredMidCol: number | undefined,
  connectionId: string,
): StructuredRoute {
  const booked: LaneSegment[] = [];
  const clearance = bendClearanceCols();
  const rowStart = Math.min(rightExit.row, splice.row);
  const rowEnd = Math.max(rightExit.row, splice.row);

  const midCol = allocateMidColumn(laneBook, rowStart, rowEnd, zone, preferredMidCol);
  if (midCol === null) {
    return {
      path: "",
      gridPoints: [],
      laneSegments: [],
      routeError: "No free mid column in center routing grid",
      bendCount: 0,
    };
  }

  // Left leg — straight horizontal into fusion dot.
  const leftHoriz = bookSharedHorizontal(
    laneBook,
    splice.row,
    leftExit.col,
    splice.col,
    connectionId,
  );
  if (!leftHoriz) {
    return failRoute("Left leg lane conflict", connectionId);
  }
  booked.push(leftHoriz);

  // Right leg — vertical bus, then one shared horizontal to the fanout exit.
  const inwardCol = Math.max(midCol, rightExit.col - clearance);
  const rightHoriz = bookSharedHorizontal(
    laneBook,
    rightExit.row,
    midCol,
    rightExit.col,
    connectionId,
  );
  const vert = bookSegment(laneBook, "vertical", midCol, rowStart, rowEnd, connectionId);

  if (!rightHoriz || !vert) {
    return failRoute("Right leg lane conflict", connectionId);
  }
  booked.push(rightHoriz, vert);
  // Horizontal splice.row midCol→splice.col is covered by the left leg booking.

  const pathPoints = dedupePoints([
    { col: leftExit.col, row: leftExit.row },
    { col: splice.col, row: splice.row },
    { col: midCol, row: splice.row },
    { col: midCol, row: rightExit.row },
    ...(inwardCol > midCol ? [{ col: inwardCol, row: rightExit.row }] : []),
    { col: rightExit.col, row: rightExit.row },
  ]);

  return {
    path: gridPointsToPath(pathPoints),
    gridPoints: pathPoints,
    laneSegments: booked,
    midTrack: midCol,
    bendCount: countGridBends(pathPoints),
  };
}

function failRoute(message: string, connectionId: string): StructuredRoute {
  return {
    path: "",
    gridPoints: [],
    laneSegments: [],
    routeError: `${message} (${connectionId})`,
    bendCount: 0,
  };
}

/** Resolve destTube group lane for a connection. */
export function preferredMidColForConnection(
  connectionId: string,
  groupLanes: Map<string, number>,
  groupConnectionMap: Map<string, string>,
): number | undefined {
  const groupId = groupConnectionMap.get(connectionId);
  if (!groupId) return undefined;
  return groupLanes.get(groupId);
}

/** Map connection id -> destTube strand group id. */
export function buildDestTubeGroupMap(
  groups: Array<{ id: string; kind: string; connectionIds: string[] }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    if (group.kind !== "destTube") continue;
    for (const connId of group.connectionIds) {
      map.set(connId, group.id);
    }
  }
  return map;
}
