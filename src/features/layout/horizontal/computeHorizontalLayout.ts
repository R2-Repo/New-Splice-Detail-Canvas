import type { GridPoint } from "@/features/grid/coords";
import { cableGroupSeparationCols } from "@/features/grid/gridOccupancy";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { ConnectionGraph, FiberStrand } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";
import { compareFibers, tubeSortIndex } from "@/features/diagram/tiaColors";
import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";
import type { PlacementPlan } from "@/features/rules/placement/types";

import { assignCableSides, stackOrderForSide } from "../assignCableSides";
import type { LayoutResult } from "../types";

// Deterministic splice-detail geometry (SDC-LAYOUT-002 / SDC-CONNECT-001).
const BASE_ROW = 6;
const LEFT_CABLE_COL = 2;
const LEFT_FANOUT_COL = 10;
const CENTER_COL = 28;
const RIGHT_FANOUT_COL = 46;
const RIGHT_CABLE_COL = 54;
const TUBE_GAP_ROWS = 1;
const CABLE_GAP_ROWS = 2;

type SideLayout = {
  fiberPlacements: GridNodePlacement[];
  cablePlacements: GridNodePlacement[];
  fiberRow: Map<string, number>;
  maxRow: number;
};

function fibersByLeg(graph: ConnectionGraph): Map<string, FiberStrand[]> {
  const map = new Map<string, FiberStrand[]>();
  for (const fiber of graph.fibers) {
    const list = map.get(fiber.legId) ?? [];
    list.push(fiber);
    map.set(fiber.legId, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        tubeSortIndex(a.tubeColor) - tubeSortIndex(b.tubeColor) ||
        compareFibers(a, b) ||
        a.fiberNumber - b.fiberNumber,
    );
  }
  return map;
}

function layoutSide(
  side: "left" | "right",
  stack: string[],
  byLeg: Map<string, FiberStrand[]>,
  startRow: number,
): SideLayout {
  const fiberPlacements: GridNodePlacement[] = [];
  const cablePlacements: GridNodePlacement[] = [];
  const fiberRow = new Map<string, number>();

  const fanoutCol = side === "left" ? LEFT_FANOUT_COL : RIGHT_FANOUT_COL;
  const cableCol = side === "left" ? LEFT_CABLE_COL : RIGHT_CABLE_COL;

  let row = startRow;
  for (const legId of stack) {
    const fibers = byLeg.get(legId) ?? [];
    if (fibers.length === 0) continue;

    const cableStart = row;
    let lastTube: string | null = null;
    for (const fiber of fibers) {
      if (lastTube !== null && fiber.tubeColor !== lastTube) row += TUBE_GAP_ROWS;
      fiberRow.set(fiber.id, row);
      fiberPlacements.push({ nodeId: `fiber-${fiber.id}`, col: fanoutCol, row });
      lastTube = fiber.tubeColor;
      row += 1;
    }
    const cableEnd = row - 1;
    cablePlacements.push({
      nodeId: `cable-${legId}`,
      col: cableCol,
      row: Math.round((cableStart + cableEnd) / 2),
    });
    row += CABLE_GAP_ROWS;
  }

  return { fiberPlacements, cablePlacements, fiberRow, maxRow: row };
}

function assignGroupLanes(
  strandInput: StrandGroupLayoutInput,
  zone: HorizontalZoneLayout,
): { groupLanes: Map<string, number>; connectionMidCols: Map<string, number> } {
  const groupLanes = new Map<string, number>();
  const connectionMidCols = new Map<string, number>();
  const destGroups = strandInput.groups
    .filter((g) => g.kind === "destTube")
    .sort((a, b) => a.label.localeCompare(b.label));

  const groupGap = cableGroupSeparationCols();
  let col = zone.centerStartCol + 1;
  let lastLeg: string | null = null;

  for (const group of destGroups) {
    const parts = group.label.split("::");
    const legId = parts[1] ?? "";
    if (lastLeg !== null && legId !== lastLeg) {
      col += groupGap;
    }
    groupLanes.set(group.id, col);
    const sortedConnIds = [...group.connectionIds].sort();
    for (const connId of sortedConnIds) {
      connectionMidCols.set(connId, col);
      col += 1;
    }
    lastLeg = legId;
  }

  return { groupLanes, connectionMidCols };
}

function buildFanoutExits(
  graph: ConnectionGraph,
  sideAssignment: Map<string, "left" | "right" | "top" | "bottom" | undefined>,
): Map<string, number> {
  const fanoutExits = new Map<string, number>();
  for (const fiber of graph.fibers) {
    const side = sideAssignment.get(fiber.legId);
    fanoutExits.set(
      fiber.id,
      side === "right" ? RIGHT_FANOUT_COL : LEFT_FANOUT_COL,
    );
  }
  return fanoutExits;
}

export async function computeHorizontalLayout(
  graph: ConnectionGraph,
  strandInput: StrandGroupLayoutInput,
  placementPlan?: PlacementPlan,
): Promise<LayoutResult> {
  const sideAssignment = placementPlan?.sideAssignment ?? assignCableSides(graph, "horizontal");
  for (const leg of graph.legs) {
    leg.side = sideAssignment.get(leg.id);
  }

  const leftStack =
    placementPlan?.stackOrder.get("left") ?? stackOrderForSide(graph, "left", sideAssignment);
  const rightStack =
    placementPlan?.stackOrder.get("right") ?? stackOrderForSide(graph, "right", sideAssignment);

  const byLeg = fibersByLeg(graph);
  const left = layoutSide("left", leftStack, byLeg, BASE_ROW);
  const right = layoutSide("right", rightStack, byLeg, BASE_ROW);

  const placements: GridNodePlacement[] = [
    ...left.cablePlacements,
    ...right.cablePlacements,
    ...left.fiberPlacements,
    ...right.fiberPlacements,
  ];

  const fiberRow = new Map<string, number>([...left.fiberRow, ...right.fiberRow]);
  const connById = new Map(graph.connections.map((c) => [c.id, c]));
  const fanoutExits = buildFanoutExits(graph, sideAssignment);

  const splicePoints: LayoutResult["splicePoints"] = [];
  const connectionRows = new Map<string, number>();

  for (const connId of strandInput.globalConnectionOrder) {
    const conn = connById.get(connId);
    let row = BASE_ROW;
    if (conn) {
      const fromSide = sideAssignment.get(conn.fromLegId);
      const leftFiberId = fromSide === "left" ? conn.fromFiberId : conn.toFiberId;
      const rightFiberId = fromSide === "left" ? conn.toFiberId : conn.fromFiberId;
      row = fiberRow.get(leftFiberId) ?? fiberRow.get(rightFiberId) ?? BASE_ROW;
    }
    connectionRows.set(connId, row);
    splicePoints.push({ connectionId: connId, point: { col: CENTER_COL, row } });
    placements.push({ nodeId: `splice-${connId}`, col: CENTER_COL, row });
  }

  const zoneLayout = {
    mode: "horizontal" as const,
    horizontal: {
      leftEndCol: LEFT_FANOUT_COL,
      centerStartCol: LEFT_FANOUT_COL + 2,
      centerEndCol: RIGHT_FANOUT_COL - 2,
      rightStartCol: RIGHT_FANOUT_COL,
    },
  };

  const { groupLanes, connectionMidCols } = assignGroupLanes(strandInput, zoneLayout.horizontal);

  return {
    layoutMode: "horizontal",
    zoneLayout,
    placements,
    splicePoints,
    groupLanes,
    connectionRows,
    fanoutExits,
    connectionMidCols,
  };
}

export type { GridPoint };

// Re-export for layout spacing reads (SDC-CONST-001).
export const LAYOUT_PITCH = SDC_DEFAULTS.grid.pitchPx;
