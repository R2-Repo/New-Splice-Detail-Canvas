import type { GridPoint } from "@/features/grid/coords";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { ConnectionGraph, FiberStrand } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";
import { compareFibers, tubeSortIndex } from "@/features/diagram/tiaColors";
import type { PlacementPlan } from "@/features/rules/placement/types";

import { assignCableSides, stackOrderForSide } from "../assignCableSides";
import type { LayoutResult } from "../types";

// Deterministic splice-detail geometry (SDC-LAYOUT-002 / SDC-CONNECT-001).
// Cables fan out individual strands grouped by buffer tube; each connection
// meets its partner at a centered fusion splice dot via fanned orthogonal legs.
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

  const splicePoints: LayoutResult["splicePoints"] = [];
  const connectionRows = new Map<string, number>();

  // Fusion dot row = the left-side fiber's row, so the left leg runs straight
  // across and the routing/fanning happens on the right (matches the oracles).
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

  return {
    layoutMode: "horizontal",
    zoneLayout,
    placements,
    splicePoints,
    groupLanes: new Map(),
    connectionRows,
  };
}

export type { GridPoint };
