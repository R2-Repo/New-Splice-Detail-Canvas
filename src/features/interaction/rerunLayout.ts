import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import type { LayoutMode } from "@/features/diagram/types";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { pxToGrid, type GridPoint } from "@/features/grid/coords";
import { runLayoutEngine } from "@/features/layout/runLayoutEngine";
import type { LayoutResult } from "@/features/layout/types";
import { pickBestLayout } from "@/features/rules/placement/pickBestLayout";
import type { PlacementPlan } from "@/features/rules/placement/types";
import { stackOrderForSide } from "@/features/layout/assignCableSides";
import { routeConnections, type RoutingResult } from "@/features/routing/routeConnections";
import type { RouteQualityBreakdown } from "@/features/routing/scoreRouting";

import { applyLocksToLayout } from "./applyLocksToLayout";
import { filterLocksByType, isCableLockGeometry, type ManualLock } from "./manualLocks";

export type RerunLayoutResult = {
  layout: LayoutResult;
  routing: RoutingResult;
  nodes: ReturnType<typeof buildReactFlowGraph>["nodes"];
  edges: ReturnType<typeof buildReactFlowGraph>["edges"];
  zoneLayout: ReturnType<typeof buildReactFlowGraph>["zoneLayout"];
  zoneMode: ReturnType<typeof buildReactFlowGraph>["zoneMode"];
  laneBook: ReturnType<typeof buildReactFlowGraph>["laneBook"];
  placementPlanId?: string;
  routeScore?: RouteQualityBreakdown;
  manualLocks: ManualLock[];
};

export type RerunLayoutOptions = {
  optimizeLayout?: boolean;
};

function buildConstrainedPlan(
  graph: ConnectionGraph,
  layoutMode: LayoutMode,
  locks: ManualLock[],
): PlacementPlan | undefined {
  const cableLocks = filterLocksByType(locks, "cable");
  if (cableLocks.length === 0) return undefined;

  const sideAssignment = new Map<string, DiagramSide>();
  for (const lock of cableLocks) {
    if (!isCableLockGeometry(lock.lockedGeometry)) continue;
    sideAssignment.set(lock.objectId, lock.lockedGeometry.side);
  }

  for (const leg of graph.legs) {
    if (!sideAssignment.has(leg.id)) {
      sideAssignment.set(leg.id, leg.side ?? "left");
    }
  }

  const stackOrder = new Map<DiagramSide, string[]>();
  if (layoutMode === "horizontal") {
    for (const side of ["left", "right"] as const) {
      stackOrder.set(side, stackOrderForSide(graph, side, sideAssignment));
    }
  }

  return {
    id: "locked-constraints",
    sideAssignment,
    stackOrder,
  };
}

export async function rerunLayoutWithLocks(
  graph: ConnectionGraph,
  layoutMode: LayoutMode,
  manualLocks: ManualLock[],
  options: RerunLayoutOptions = {},
): Promise<RerunLayoutResult> {
  const optimize = options.optimizeLayout !== false && manualLocks.length === 0;

  let layout: LayoutResult;
  let routing: RoutingResult;
  let placementPlanId: string | undefined;
  let routeScore: RouteQualityBreakdown | undefined;

  if (optimize) {
    const optimized = await pickBestLayout(graph, layoutMode);
    layout = optimized.layout;
    routing = optimized.routing;
    placementPlanId = optimized.plan.id;
    routeScore = optimized.breakdown;
  } else {
    const plan = buildConstrainedPlan(graph, layoutMode, manualLocks);
    layout = await runLayoutEngine(graph, { layoutMode, placementPlan: plan });
    if (manualLocks.length > 0) {
      layout = applyLocksToLayout(layout, graph, manualLocks);
    }
    routing = routeConnections(graph, layout, manualLocks);
  }

  const rf = buildReactFlowGraph(graph, layout, routing, manualLocks);

  return {
    layout,
    routing,
    nodes: rf.nodes,
    edges: rf.edges,
    zoneLayout: rf.zoneLayout,
    zoneMode: rf.zoneMode,
    laneBook: rf.laneBook,
    placementPlanId,
    routeScore,
    manualLocks,
  };
}

const LEFT_CABLE_COL = 2;
const RIGHT_CABLE_COL = 54;

export function resolveCableSideFromCol(
  col: number,
  zone: HorizontalZoneLayout | null,
  currentSide: DiagramSide,
): DiagramSide {
  if (!zone) return currentSide;
  const center = Math.round((zone.centerStartCol + zone.centerEndCol) / 2);
  if (col < center) return "left";
  if (col > center) return "right";
  return currentSide;
}

export function snapCableLockGeometry(
  pixelX: number,
  pixelY: number,
  cableBoxHeightPx: number,
  side: DiagramSide,
  zone: HorizontalZoneLayout | null,
): GridPoint & { side: DiagramSide } {
  let col = pxToGrid(pixelX);
  const row = pxToGrid(pixelY + cableBoxHeightPx / 2);
  const resolvedSide = resolveCableSideFromCol(col, zone, side);
  col = resolvedSide === "right" ? RIGHT_CABLE_COL : LEFT_CABLE_COL;
  return { col, row, side: resolvedSide };
}

export function snapSpliceLockGeometry(pixelX: number, pixelY: number): GridPoint {
  return { col: pxToGrid(pixelX), row: pxToGrid(pixelY) };
}

export function snapStrandLaneCol(pixelX: number): number {
  return pxToGrid(pixelX);
}
