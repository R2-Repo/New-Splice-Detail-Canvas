import { gridToPx, pixelToGridPoint, type GridPoint } from "@/features/grid/coords";
import { LaneBook } from "@/features/grid/laneBook";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { isInQuadCenter, type QuadZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph } from "@/features/diagram/types";
import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";
import type { LayoutResult, ZoneLayout } from "@/features/layout/types";

/** Bend clearance expressed in grid columns (SDC-CONST-001 / SDC-ROUTE-001). */
const CLEARANCE_COLS = Math.max(1, Math.round(SDC_DEFAULTS.spacing.minBendClearancePx / SDC_DEFAULTS.grid.pitchPx));

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

    routes.push({ connectionId: conn.id, ...buildFannedRoute(source, splice, target) });
  }

  return { laneBook, routes };
}

/** Orthogonal leg from a fanout exit point toward the fusion dot (3 grid points). */
function legPoints(fiber: GridPoint, dot: GridPoint): GridPoint[] {
  const dir = fiber.col <= dot.col ? 1 : -1;
  let bendCol = fiber.col + dir * CLEARANCE_COLS;
  bendCol = dir === 1 ? Math.min(bendCol, dot.col) : Math.max(bendCol, dot.col);
  return [
    { col: fiber.col, row: fiber.row },
    { col: bendCol, row: fiber.row },
    { col: bendCol, row: dot.row },
    { col: dot.col, row: dot.row },
  ];
}

/** Build a fanned orthogonal path: from-fiber -> fusion dot -> to-fiber. */
function buildFannedRoute(
  source: GridPoint,
  splice: GridPoint,
  target: GridPoint,
): Omit<RoutedConnection, "connectionId"> {
  const left = legPoints(source, splice);
  const right = legPoints(target, splice).reverse();
  const points = dedupePoints([...left, ...right.slice(1)]);
  return { path: pointsToPath(points), midTrack: splice.col };
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

/** Orthogonal polyline with rounded corners (quadratic bevels at each bend). */
function pointsToPath(points: GridPoint[]): string {
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
