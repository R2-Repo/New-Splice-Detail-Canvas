import { pixelToGridPoint, type GridPoint } from "@/features/grid/coords";
import { buildLayoutOccupancy } from "@/features/grid/gridOccupancy";
import { LaneBook, type LaneSegment } from "@/features/grid/laneBook";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { isInQuadCenter, type QuadZoneLayout } from "@/features/grid/quadZones";
import { classifyStrandGroups } from "@/features/diagram/strandGroups";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { LayoutResult, ZoneLayout } from "@/features/layout/types";

import {
  buildDestTubeGroupMap,
  gridPointsToPath,
  preferredMidColForConnection,
  routeHorizontalConnection,
} from "./horizontalRouter";

export type RoutedConnection = {
  connectionId: string;
  path: string;
  routeError?: string;
  midTrack?: number;
  gridPoints?: GridPoint[];
  laneSegments?: LaneSegment[];
  bendCount?: number;
};

export type RoutingResult = {
  laneBook: LaneBook;
  routes: RoutedConnection[];
};

function placementMap(placements: GridNodePlacement[]): Map<string, GridPoint> {
  return new Map(placements.map((p) => [p.nodeId, { col: p.col, row: p.row }]));
}

function fanoutExitPoint(
  fiberId: string,
  fiberPlacement: GridPoint,
  layout: LayoutResult,
): GridPoint {
  const exitCol = layout.fanoutExits.get(fiberId) ?? fiberPlacement.col;
  return { col: exitCol, row: fiberPlacement.row };
}

export function routeConnections(
  graph: ConnectionGraph,
  layout: LayoutResult,
): RoutingResult {
  const laneBook = buildLayoutOccupancy(layout);
  const points = placementMap(layout.placements);
  const routes: RoutedConnection[] = [];
  const strandInput = classifyStrandGroups(graph);
  const destGroupMap = buildDestTubeGroupMap(strandInput.groups);

  const order = layout.splicePoints.map((sp) => sp.connectionId);

  for (const connId of order) {
    const conn = graph.connections.find((c) => c.id === connId);
    if (!conn) continue;

    const fromPlacement = points.get(`fiber-${conn.fromFiberId}`);
    const toPlacement = points.get(`fiber-${conn.toFiberId}`);
    const splice = points.get(`splice-${conn.id}`);

    if (!fromPlacement || !toPlacement || !splice) {
      routes.push({
        connectionId: conn.id,
        path: "",
        routeError: "Missing anchor placement",
      });
      continue;
    }

    if (layout.layoutMode === "quad" && layout.zoneLayout.mode === "quad") {
      const source = fanoutExitPoint(conn.fromFiberId, fromPlacement, layout);
      const target = fanoutExitPoint(conn.toFiberId, toPlacement, layout);
      const quadRoute = routeQuadSpliceLeg(source, splice, target, layout.zoneLayout.quad, laneBook);
      routes.push({ connectionId: conn.id, ...quadRoute });
      continue;
    }

    if (layout.zoneLayout.mode !== "horizontal") {
      routes.push({ connectionId: conn.id, path: "", routeError: "Invalid zone layout" });
      continue;
    }

    const fromLeg = graph.legs.find((l) => l.id === conn.fromLegId);
    const leftFiberId = fromLeg?.side === "left" ? conn.fromFiberId : conn.toFiberId;
    const rightFiberId = fromLeg?.side === "left" ? conn.toFiberId : conn.fromFiberId;

    const leftFiberPlacement = points.get(`fiber-${leftFiberId}`);
    const rightFiberPlacement = points.get(`fiber-${rightFiberId}`);
    if (!leftFiberPlacement || !rightFiberPlacement) {
      routes.push({ connectionId: conn.id, path: "", routeError: "Missing side fiber placement" });
      continue;
    }

    const leftExit = fanoutExitPoint(leftFiberId, leftFiberPlacement, layout);
    const rightExit = fanoutExitPoint(rightFiberId, rightFiberPlacement, layout);
    const preferredMid = layout.connectionMidCols.get(conn.id) ?? preferredMidColForConnection(conn.id, layout.groupLanes, destGroupMap);

    const structured = routeHorizontalConnection(
      leftExit,
      splice,
      rightExit,
      layout.zoneLayout.horizontal,
      laneBook,
      preferredMid,
      conn.id,
    );

    routes.push({
      connectionId: conn.id,
      path: structured.path,
      routeError: structured.routeError,
      midTrack: structured.midTrack,
      gridPoints: structured.gridPoints,
      laneSegments: structured.laneSegments,
      bendCount: structured.bendCount,
    });
  }

  return { laneBook, routes };
}

export function routeQuadSpliceLeg(
  source: GridPoint,
  splice: GridPoint,
  target: GridPoint,
  quad: QuadZoneLayout,
  laneBook: LaneBook,
): Omit<RoutedConnection, "connectionId"> {
  const midCol = allocateQuadMidColumn(laneBook, source.row, target.row, splice.row, quad);
  if (midCol === null) {
    return { path: "", routeError: "No free quad mid column" };
  }

  const segments = [
    bookAndSegment(laneBook, "horizontal", source.row, source.col, midCol),
    bookAndSegment(laneBook, "vertical", midCol, source.row, splice.row),
    bookAndSegment(laneBook, "horizontal", splice.row, midCol, splice.col),
    bookAndSegment(laneBook, "vertical", splice.col, splice.row, target.row),
    bookAndSegment(laneBook, "horizontal", target.row, splice.col, target.col),
  ];

  if (segments.some((s) => s === null)) {
    return { path: "", routeError: "Quad lane conflict" };
  }

  const gridPoints: GridPoint[] = [
    source,
    { col: midCol, row: source.row },
    { col: midCol, row: splice.row },
    splice,
    { col: splice.col, row: target.row },
    target,
  ];

  return { path: gridPointsToPath(gridPoints), midTrack: midCol, gridPoints, bendCount: 4 };
}

function allocateQuadMidColumn(
  laneBook: LaneBook,
  rowA: number,
  rowB: number,
  rowSplice: number,
  quad: QuadZoneLayout,
): number | null {
  const rowStart = Math.min(rowA, rowB, rowSplice);
  const rowEnd = Math.max(rowA, rowB, rowSplice);

  for (let col = quad.centerStartCol; col <= quad.centerEndCol; col += 1) {
    if (!isInQuadCenter(col, rowSplice, quad)) continue;
    const conflict = laneBook.conflicts({
      orientation: "vertical",
      track: col,
      spanStart: rowStart,
      spanEnd: rowEnd,
    });
    if (!conflict) return col;
  }
  return null;
}

function bookAndSegment(
  laneBook: LaneBook,
  orientation: "horizontal" | "vertical",
  track: number,
  a: number,
  b: number,
): true | null {
  const ok = laneBook.tryBook({
    orientation,
    track,
    spanStart: Math.min(a, b),
    spanEnd: Math.max(a, b),
  });
  return ok ? true : null;
}

export function snapPixelToGridPlacement(
  nodeId: string,
  x: number,
  y: number,
): GridNodePlacement {
  const pt = pixelToGridPoint(x, y);
  return { nodeId, col: pt.col, row: pt.row };
}

export function extractHorizontalZoneLayout(zone: ZoneLayout): HorizontalZoneLayout | null {
  return zone.mode === "horizontal" ? zone.horizontal : null;
}

export function extractQuadZoneLayout(zone: ZoneLayout): QuadZoneLayout | null {
  return zone.mode === "quad" ? zone.quad : null;
}

export { gridPointsToPath };
