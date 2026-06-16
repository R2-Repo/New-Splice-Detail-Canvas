import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";
import { detectLateVerticalBend } from "@/features/grid/routeOrthogonal";
import type { LayoutResult } from "@/features/layout/types";
import type { DiagramSnapshot } from "@/features/rules/types";

import type { RoutingResult } from "./routeConnections";

export type ScoreWeights = {
  crossings: number;
  loopBacks: number;
  bends: number;
  verticalSpread: number;
  routeErrors: number;
};

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  crossings: 1000,
  loopBacks: 500,
  bends: 100,
  verticalSpread: 1,
  routeErrors: 10_000,
};

export type RouteQualityBreakdown = {
  crossings: number;
  loopBacks: number;
  bends: number;
  verticalSpread: number;
  routeErrors: number;
  score: number;
};

export type LineSegment = { x1: number; y1: number; x2: number; y2: number };

export function parseSvgPath(path: string): LineSegment[] {
  const tokens = path.trim().split(/\s+/);
  const segments: LineSegment[] = [];
  let x = 0;
  let y = 0;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (cmd === "M" || cmd === "L") {
      const nx = Number.parseFloat(tokens[i + 1] ?? "");
      const ny = Number.parseFloat(tokens[i + 2] ?? "");
      if (Number.isFinite(nx) && Number.isFinite(ny)) {
        if (cmd === "L" || segments.length === 0) {
          segments.push({ x1: x, y1: y, x2: nx, y2: ny });
        }
        x = nx;
        y = ny;
      }
      i += 3;
      continue;
    }
    i += 1;
  }

  return segments.filter((s) => s.x1 !== s.x2 || s.y1 !== s.y2);
}

export function countOrthogonalBends(segments: LineSegment[]): number {
  if (segments.length < 2) return 0;

  let bends = 0;
  for (let i = 1; i < segments.length; i += 1) {
    const prev = segments[i - 1]!;
    const curr = segments[i]!;
    const prevHoriz = prev.y1 === prev.y2;
    const currHoriz = curr.y1 === curr.y2;
    if (prevHoriz !== currHoriz) bends += 1;
  }
  return bends;
}

function segmentsIntersect(a: LineSegment, b: LineSegment): boolean {
  const aHoriz = a.y1 === a.y2;
  const bHoriz = b.y1 === b.y2;
  if (aHoriz === bHoriz) return false;

  const h = aHoriz ? a : b;
  const v = aHoriz ? b : a;

  const hMinX = Math.min(h.x1, h.x2);
  const hMaxX = Math.max(h.x1, h.x2);
  const vMinY = Math.min(v.y1, v.y2);
  const vMaxY = Math.max(v.y1, v.y2);
  const hx = h.y1;
  const vx = v.x1;

  if (vx <= hMinX || vx >= hMaxX) return false;
  if (hx <= vMinY || hx >= vMaxY) return false;
  return true;
}

function shareEndpoint(a: LineSegment, b: LineSegment): boolean {
  const pointsA = [
    `${a.x1},${a.y1}`,
    `${a.x2},${a.y2}`,
  ];
  const pointsB = [
    `${b.x1},${b.y1}`,
    `${b.x2},${b.y2}`,
  ];
  return pointsA.some((p) => pointsB.includes(p));
}

export function countSegmentCrossings(allSegments: LineSegment[][]): number {
  const flat = allSegments.flat();
  let crossings = 0;

  for (let i = 0; i < flat.length; i += 1) {
    for (let j = i + 1; j < flat.length; j += 1) {
      const a = flat[i]!;
      const b = flat[j]!;
      if (shareEndpoint(a, b)) continue;
      if (segmentsIntersect(a, b)) crossings += 1;
    }
  }

  return crossings;
}

function placementMap(layout: LayoutResult): Map<string, { col: number; row: number }> {
  return new Map(layout.placements.map((p) => [p.nodeId, { col: p.col, row: p.row }]));
}

function legSideMap(graph: ConnectionGraph): Map<string, DiagramSide | undefined> {
  return new Map(graph.legs.map((leg) => [leg.id, leg.side]));
}

export function countLoopBacks(
  graph: ConnectionGraph,
  layout: LayoutResult,
  routing: RoutingResult,
): number {
  const points = placementMap(layout);
  const sides = legSideMap(graph);
  let loopBacks = 0;

  for (const conn of graph.connections) {
    const fromSide = sides.get(conn.fromLegId);
    const toSide = sides.get(conn.toLegId);
    if (!fromSide || !toSide || fromSide !== toSide) continue;

    loopBacks += 1;

    const source = points.get(`fiber-${conn.fromFiberId}`);
    const target = points.get(`fiber-${conn.toFiberId}`);
    const route = routing.routes.find((r) => r.connectionId === conn.id);
    if (!source || !target || !route?.path || layout.zoneLayout.mode !== "horizontal") continue;

    const midTrack = route.midTrack;
    if (midTrack !== undefined) {
      const late = detectLateVerticalBend(source, midTrack, layout.zoneLayout.horizontal);
      if (late) loopBacks += 1;
    }
  }

  return loopBacks;
}

export function computeVerticalSpread(graph: ConnectionGraph, layout: LayoutResult): number {
  const rowsByPair = new Map<string, number[]>();

  for (const conn of graph.connections) {
    const key = [conn.fromLegId, conn.toLegId].sort().join("::");
    const row = layout.connectionRows.get(conn.id);
    if (row === undefined) continue;
    const list = rowsByPair.get(key) ?? [];
    list.push(row);
    rowsByPair.set(key, list);
  }

  let spread = 0;
  for (const rows of rowsByPair.values()) {
    if (rows.length < 2) continue;
    spread += Math.max(...rows) - Math.min(...rows);
  }

  return spread;
}

export function scoreRoutingFromParts(
  graph: ConnectionGraph,
  layout: LayoutResult,
  routing: RoutingResult,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): RouteQualityBreakdown {
  const allSegments: LineSegment[][] = [];
  let bends = 0;

  for (const route of routing.routes) {
    if (!route.path) continue;
    const segments = parseSvgPath(route.path);
    allSegments.push(segments);
    bends += countOrthogonalBends(segments);
  }

  const crossings = countSegmentCrossings(allSegments);
  const loopBacks = countLoopBacks(graph, layout, routing);
  const verticalSpread = computeVerticalSpread(graph, layout);
  const routeErrors = routing.routes.filter((r) => !r.path || r.routeError).length;

  const score =
    crossings * weights.crossings +
    loopBacks * weights.loopBacks +
    bends * weights.bends +
    verticalSpread * weights.verticalSpread +
    routeErrors * weights.routeErrors;

  return { crossings, loopBacks, bends, verticalSpread, routeErrors, score };
}

export function scoreRouting(
  snapshot: DiagramSnapshot,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): RouteQualityBreakdown {
  return scoreRoutingFromParts(
    snapshot.connectionGraph,
    snapshot.layout,
    snapshot.routing,
    weights,
  );
}
