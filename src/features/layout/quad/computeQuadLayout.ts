import { pxToGrid } from "@/features/grid/coords";
import type { GridNodePlacement } from "@/features/grid/placement";
import { defaultQuadZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";
import { connectionRowIndex } from "@/features/diagram/strandGroups";
import type { PlacementPlan } from "@/features/rules/placement/types";

import { assignCableSides, stackOrderForSide } from "../assignCableSides";
import { applyElkLayout, collectElkNodePositions } from "../elk/applyElkLayout";
import { buildElkGraph } from "../elk/buildElkGraph";
import type { LayoutResult } from "../types";

const BASE = 6;

export async function computeQuadLayout(
  graph: ConnectionGraph,
  strandInput: StrandGroupLayoutInput,
  placementPlan?: PlacementPlan,
): Promise<LayoutResult> {
  const sideAssignment =
    placementPlan?.sideAssignment ?? assignCableSides(graph, "quad");
  const quad = defaultQuadZoneLayout(graph.connections.length);
  const zoneLayout = { mode: "quad" as const, quad };

  for (const leg of graph.legs) {
    leg.side = sideAssignment.get(leg.id);
  }

  const elkGraph = buildElkGraph({
    graph,
    strandInput,
    sideAssignment,
    layoutMode: "quad",
  });
  const laidOut = await applyElkLayout(elkGraph);
  const elkPositions = collectElkNodePositions(laidOut);

  const placements: GridNodePlacement[] = [];
  const splicePoints: LayoutResult["splicePoints"] = [];
  const connectionRows = new Map<string, number>();
  const groupLanes = new Map<string, number>();

  for (const side of ["left", "right", "top", "bottom"] as DiagramSide[]) {
    const stack =
      placementPlan?.stackOrder.get(side) ??
      stackOrderForSide(graph, side, sideAssignment);
    stack.forEach((legId, index) => {
      const pos = quadCablePosition(side, index, quad);
      placements.push({ nodeId: `cable-${legId}`, ...pos });
    });
  }

  const centerColSpan = quad.centerEndCol - quad.centerStartCol + 1;

  strandInput.globalConnectionOrder.forEach((connId, orderIndex) => {
    const col = quad.centerStartCol + (orderIndex % centerColSpan);
    const row = quad.centerStartRow + Math.floor(orderIndex / centerColSpan);
    connectionRows.set(connId, row);

    const elkKey = `splice-${connId}`;
    const elkPos = elkPositions.get(elkKey);
    let finalCol = col;
    let finalRow = row;
    if (elkPos) {
      finalCol = Math.max(quad.centerStartCol, Math.min(quad.centerEndCol, pxToGrid(elkPos.x)));
      finalRow = Math.max(quad.centerStartRow, Math.min(quad.centerEndRow, pxToGrid(elkPos.y)));
    }

    splicePoints.push({ connectionId: connId, point: { col: finalCol, row: finalRow } });
    placements.push({ nodeId: `splice-${connId}`, col: finalCol, row: finalRow });
  });

  for (const group of strandInput.groups) {
    const firstConn = group.connectionIds[0];
    if (!firstConn) continue;
    groupLanes.set(
      group.id,
      quad.centerStartCol + (connectionRowIndex(strandInput.globalConnectionOrder, firstConn) % centerColSpan),
    );
  }

  for (const conn of graph.connections) {
    const row = connectionRows.get(conn.id) ?? quad.centerStartRow;
    const fromSide = sideAssignment.get(conn.fromLegId) ?? "left";
    const toSide = sideAssignment.get(conn.toLegId) ?? "right";
    placements.push(
      { nodeId: `fiber-${conn.fromFiberId}`, ...fiberAnchorQuad(fromSide, row, quad, "out") },
      { nodeId: `fiber-${conn.toFiberId}`, ...fiberAnchorQuad(toSide, row, quad, "in") },
    );
  }

  return {
    layoutMode: "quad",
    zoneLayout,
    placements,
    splicePoints,
    groupLanes,
    connectionRows,
    fanoutExits: buildFanoutExitsFromPlacements(placements),
    connectionMidCols: new Map(
      strandInput.globalConnectionOrder.map((id, i) => [id, quad.centerStartCol + i]),
    ),
  };
}

function buildFanoutExitsFromPlacements(placements: GridNodePlacement[]): Map<string, number> {
  const fanoutExits = new Map<string, number>();
  for (const p of placements) {
    if (!p.nodeId.startsWith("fiber-")) continue;
    fanoutExits.set(p.nodeId.replace("fiber-", ""), p.col);
  }
  return fanoutExits;
}

function quadCablePosition(
  side: DiagramSide,
  stackIndex: number,
  quad: ReturnType<typeof defaultQuadZoneLayout>,
): { col: number; row: number } {
  const offset = BASE + stackIndex * 5;
  switch (side) {
    case "left":
      return { col: 2, row: quad.centerStartRow + offset };
    case "right":
      return { col: quad.rightStartCol + 2, row: quad.centerStartRow + offset };
    case "top":
      return { col: quad.centerStartCol + offset, row: 2 };
    case "bottom":
      return { col: quad.centerStartCol + offset, row: quad.bottomStartRow + 2 };
    default:
      return { col: 2, row: offset };
  }
}

function fiberAnchorQuad(
  side: DiagramSide,
  row: number,
  quad: ReturnType<typeof defaultQuadZoneLayout>,
  direction: "in" | "out",
): { col: number; row: number } {
  void direction;
  switch (side) {
    case "left":
      return { col: quad.leftEndCol, row };
    case "right":
      return { col: quad.rightStartCol - 1, row };
    case "top":
      return { col: row, row: quad.topEndRow };
    case "bottom":
      return { col: row, row: quad.bottomStartRow - 1 };
    default:
      return { col: quad.leftEndCol, row };
  }
}
