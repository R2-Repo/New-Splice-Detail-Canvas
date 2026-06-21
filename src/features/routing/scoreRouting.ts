import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";
import { gridToPx } from "@/features/grid/coords";
import { detectLateVerticalBend } from "@/features/grid/routeOrthogonal";
import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";
import type { LayoutResult } from "@/features/layout/types";
import type { DiagramSnapshot } from "@/features/rules/types";

import type { RoutingResult } from "./routeConnections";

/** SDC-SCORE-001 starting weights (relative priority stable). */
export type ScoreWeights = {
  unnecessaryCrossing: number;
  controlledCrossing: number;
  sharedLaneNearMiss: number;
  spacingNearMiss: number;
  extraBend: number;
  pathSegment: number;
  nestingBreak: number;
  labelTruncation: number;
  crowdedDot: number;
  excessFanoutSpacing: number;
  verticalSpread: number;
};

export const SDC_SCORE_WEIGHTS: ScoreWeights = {
  unnecessaryCrossing: 100,
  controlledCrossing: 25,
  sharedLaneNearMiss: 80,
  spacingNearMiss: 40,
  extraBend: 15,
  pathSegment: 1,
  nestingBreak: 30,
  labelTruncation: 10,
  crowdedDot: 20,
  excessFanoutSpacing: 10,
  verticalSpread: 1,
};

/** @deprecated Legacy weights — use SDC_SCORE_WEIGHTS. */
export const DEFAULT_SCORE_WEIGHTS = {
  crossings: 1000,
  loopBacks: 500,
  bends: 100,
  verticalSpread: 1,
  routeErrors: 10_000,
};

export type RouteQualityBreakdown = {
  rejected: boolean;
  hardFailures: string[];
  crossings: number;
  loopBacks: number;
  bends: number;
  verticalSpread: number;
  routeErrors: number;
  nestingBreaks: number;
  pathSegments: number;
  score: number;
  candidateId?: string;
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

export function gridPointsToSegments(
  points: Array<{ col: number; row: number }>,
): LineSegment[] {
  const segments: LineSegment[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    segments.push({
      x1: gridToPx(a.col),
      y1: gridToPx(a.row),
      x2: gridToPx(b.col),
      y2: gridToPx(b.row),
    });
  }
  return segments;
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
  const pointsA = [`${a.x1},${a.y1}`, `${a.x2},${a.y2}`];
  const pointsB = [`${b.x1},${b.y1}`, `${b.x2},${b.y2}`];
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

/** Count dest-tube groups whose connections use non-adjacent mid tracks. */
export function countNestingBreaks(layout: LayoutResult, routing: RoutingResult): number {
  const byGroupTracks = new Map<string, number[]>();

  for (const [groupId, preferred] of layout.groupLanes) {
    byGroupTracks.set(groupId, [preferred]);
  }

  for (const route of routing.routes) {
    const mid = route.midTrack;
    if (mid === undefined) continue;
    for (const [groupId, preferred] of layout.groupLanes) {
      if (Math.abs(mid - preferred) <= 1) {
        const list = byGroupTracks.get(groupId) ?? [];
        list.push(mid);
        byGroupTracks.set(groupId, list);
      }
    }
  }

  let breaks = 0;
  for (const tracks of byGroupTracks.values()) {
    const unique = [...new Set(tracks)].sort((a, b) => a - b);
    for (let i = 1; i < unique.length; i += 1) {
      if (unique[i]! - unique[i - 1]! > 1) breaks += 1;
    }
  }
  return breaks;
}

function routeSegmentsForScoring(route: RoutingResult["routes"][number]): LineSegment[] {
  if (route.gridPoints && route.gridPoints.length >= 2) {
    return gridPointsToSegments(route.gridPoints);
  }
  if (route.path) return parseSvgPath(route.path);
  return [];
}

export function scoreRoutingFromParts(
  graph: ConnectionGraph,
  layout: LayoutResult,
  routing: RoutingResult,
  weights: ScoreWeights = SDC_SCORE_WEIGHTS,
  candidateId?: string,
): RouteQualityBreakdown {
  const hardFailures: string[] = [];
  const routeErrors = routing.routes.filter((r) => !r.path || r.routeError).length;

  if (routeErrors > 0) {
    hardFailures.push(`${routeErrors} connection(s) failed to route`);
  }

  const allSegments: LineSegment[][] = [];
  let bends = 0;
  let pathSegments = 0;

  for (const route of routing.routes) {
    if (route.routeError) continue;
    const segments = routeSegmentsForScoring(route);
    if (segments.length === 0 && route.path) {
      hardFailures.push(`Connection ${route.connectionId} has empty segment list`);
    }
    allSegments.push(segments);
    const routeBends = route.bendCount ?? countOrthogonalBends(segments);
    bends += routeBends;
    pathSegments += segments.length;

    if (routeBends > SDC_DEFAULTS.bends.hardMax) {
      hardFailures.push(`Connection ${route.connectionId} exceeds hard bend limit (${routeBends})`);
    }
  }

  const crossings = countSegmentCrossings(allSegments);
  const loopBacks = countLoopBacks(graph, layout, routing);
  const verticalSpread = computeVerticalSpread(graph, layout);
  const nestingBreaks = countNestingBreaks(layout, routing);

  const preferredMax = SDC_DEFAULTS.bends.preferredMaxTwoSided;
  const extraBends = Math.max(0, bends - preferredMax * graph.connections.length);

  const rejected = hardFailures.length > 0;

  const score = rejected
    ? Number.POSITIVE_INFINITY
    : crossings * weights.unnecessaryCrossing +
      loopBacks * weights.controlledCrossing +
      extraBends * weights.extraBend +
      verticalSpread * weights.verticalSpread +
      nestingBreaks * weights.nestingBreak +
      Math.max(0, pathSegments - graph.connections.length * 4) * weights.pathSegment;

  return {
    rejected,
    hardFailures,
    crossings,
    loopBacks,
    bends,
    verticalSpread,
    routeErrors,
    nestingBreaks,
    pathSegments,
    score,
    candidateId,
  };
}

export function scoreRouting(
  snapshot: DiagramSnapshot,
  weights: ScoreWeights = SDC_SCORE_WEIGHTS,
): RouteQualityBreakdown {
  return scoreRoutingFromParts(
    snapshot.connectionGraph,
    snapshot.layout,
    snapshot.routing,
    weights,
  );
}
