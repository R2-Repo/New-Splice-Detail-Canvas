import { gridToPx, pixelToGridPoint, type GridPoint } from "@/features/grid/coords";
import { LaneBook } from "@/features/grid/laneBook";
import type { GridNodePlacement } from "@/features/grid/placement";
import {
  routeHorizontalSpliceLeg,
  type OrthogonalRouteResult,
  type RouteError,
} from "@/features/grid/routeOrthogonal";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { isInQuadCenter, type QuadZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { LayoutResult, ZoneLayout } from "@/features/layout/types";

export type RoutedConnection = {
  connectionId: string;
  path: string;
  routeError?: string;
  midTrack?: number;
};

export type RoutingResult = {
  laneBook: LaneBook;
  routes: RoutedConnection[];
};

function placementMap(placements: GridNodePlacement[]): Map<string, GridPoint> {
  return new Map(placements.map((p) => [p.nodeId, { col: p.col, row: p.row }]));
}

export function routeConnections(
  graph: ConnectionGraph,
  layout: LayoutResult,
): RoutingResult {
  const laneBook = new LaneBook();
  const points = placementMap(layout.placements);
  const routes: RoutedConnection[] = [];

  for (const conn of graph.connections) {
    const source = points.get(`fiber-${conn.fromFiberId}`);
    const splice = points.get(`splice-${conn.id}`);
    const target = points.get(`fiber-${conn.toFiberId}`);

    if (!source || !splice || !target) {
      routes.push({
        connectionId: conn.id,
        path: "",
        routeError: "Missing anchor placement",
      });
      continue;
    }

    if (layout.layoutMode === "quad" && layout.zoneLayout.mode === "quad") {
      const quadRoute = routeQuadSpliceLeg(source, splice, target, layout.zoneLayout.quad, laneBook);
      routes.push({ connectionId: conn.id, ...quadRoute });
      continue;
    }

    if (layout.zoneLayout.mode !== "horizontal") {
      routes.push({ connectionId: conn.id, path: "", routeError: "Invalid zone layout" });
      continue;
    }

    const leg1 = routeHorizontalSpliceLeg(source, splice, layout.zoneLayout.horizontal, laneBook);
    const leg2 = routeHorizontalSpliceLeg(splice, target, layout.zoneLayout.horizontal, laneBook);

    routes.push({
      connectionId: conn.id,
      ...combineHorizontalLegs(leg1, leg2, splice, target),
    });
  }

  return { laneBook, routes };
}

function combineHorizontalLegs(
  leg1: OrthogonalRouteResult | RouteError,
  leg2: OrthogonalRouteResult | RouteError,
  _splice: GridPoint,
  target: GridPoint,
): Omit<RoutedConnection, "connectionId"> {
  if ("code" in leg1) return { path: "", routeError: leg1.message };
  if ("code" in leg2) return { path: "", routeError: leg2.message };

  const tx = gridToPx(target.col);
  const ty = gridToPx(target.row);

  const path = `${leg1.path} L ${tx} ${ty}`;
  return { path, midTrack: leg1.midXCol };
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

  const sx = gridToPx(source.col);
  const sy = gridToPx(source.row);
  const mx = gridToPx(midCol);
  const spx = gridToPx(splice.col);
  const spy = gridToPx(splice.row);
  const tx = gridToPx(target.col);
  const ty = gridToPx(target.row);

  const path = `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${spy} L ${spx} ${spy} L ${spx} ${ty} L ${tx} ${ty}`;
  return { path, midTrack: midCol };
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
    const conflict = laneBook.isBooked({
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
