import { bendClearanceCols } from "@/features/grid/gridOccupancy";
import type { GridPoint } from "@/features/grid/coords";
import type { HorizontalZoneLayout } from "@/features/grid/zones";

import type { RoutedConnection } from "./routeConnections";

export function routeGridPoints(route: RoutedConnection): GridPoint[] {
  return route.gridPoints ?? [];
}

export function isOrthogonalPath(points: GridPoint[]): boolean {
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (a.col !== b.col && a.row !== b.row) return false;
  }
  return true;
}

export function countRouteBends(points: GridPoint[]): number {
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

export function routeInsideHorizontalZone(
  points: GridPoint[],
  zone: HorizontalZoneLayout,
): boolean {
  for (const p of points) {
    if (p.col < zone.centerStartCol || p.col > zone.centerEndCol) {
      if (p.col <= zone.leftEndCol || p.col >= zone.rightStartCol) continue;
      return false;
    }
  }
  return true;
}

export function meetsBendClearance(
  points: GridPoint[],
  zone: HorizontalZoneLayout,
  fanoutExits: Map<string, number>,
): boolean {
  const clearance = bendClearanceCols();
  if (points.length < 2) return true;

  const start = points[0]!;
  const end = points[points.length - 1]!;

  if (start.col <= zone.leftEndCol) {
    const entry = points.find((p) => p.col >= zone.centerStartCol);
    if (entry && entry.col - start.col < clearance) return false;
  }
  if (end.col >= zone.rightStartCol) {
    const inward = points.find((p) => p.col <= zone.centerEndCol && p.row === end.row);
    if (inward && end.col - inward.col < clearance) return false;
  }
  void fanoutExits;
  return true;
}

export function midTracksByConnection(
  routes: RoutedConnection[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const route of routes) {
    if (route.midTrack !== undefined) map.set(route.connectionId, route.midTrack);
  }
  return map;
}
