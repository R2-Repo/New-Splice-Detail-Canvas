import { pxToGrid, type GridPoint } from "@/features/grid/coords";
import type { GridNodePlacement } from "@/features/grid/placement";
import { defaultHorizontalZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";
import { connectionRowIndex } from "@/features/diagram/strandGroups";

import { assignCableSides, stackOrderForSide } from "../assignCableSides";
import { applyElkLayout, collectElkNodePositions } from "../elk/applyElkLayout";
import { buildElkGraph } from "../elk/buildElkGraph";
import type { LayoutResult } from "../types";

const BASE_ROW = 8;
const CABLE_COL_LEFT = 4;
const CABLE_COL_RIGHT_OFFSET = 2;

export async function computeHorizontalLayout(
  graph: ConnectionGraph,
  strandInput: StrandGroupLayoutInput,
): Promise<LayoutResult> {
  const sideAssignment = assignCableSides(graph, "horizontal");
  const zoneLayout = {
    mode: "horizontal" as const,
    horizontal: defaultHorizontalZoneLayout(graph.connections.length),
  };

  for (const leg of graph.legs) {
    leg.side = sideAssignment.get(leg.id);
  }

  const leftStack = stackOrderForSide(graph, "left", sideAssignment);
  const rightStack = stackOrderForSide(graph, "right", sideAssignment);

  const elkGraph = buildElkGraph({
    graph,
    strandInput,
    sideAssignment,
    layoutMode: "horizontal",
  });
  const laidOut = await applyElkLayout(elkGraph);
  const elkPositions = collectElkNodePositions(laidOut);

  const placements: GridNodePlacement[] = [];
  const splicePoints: LayoutResult["splicePoints"] = [];
  const connectionRows = new Map<string, number>();
  const groupLanes = new Map<string, number>();

  const rightStartCol = zoneLayout.horizontal.rightStartCol + CABLE_COL_RIGHT_OFFSET;

  leftStack.forEach((legId, stackIndex) => {
    placements.push({
      nodeId: `cable-${legId}`,
      col: CABLE_COL_LEFT,
      row: BASE_ROW + stackIndex * 6,
    });
  });

  rightStack.forEach((legId, stackIndex) => {
    placements.push({
      nodeId: `cable-${legId}`,
      col: rightStartCol,
      row: BASE_ROW + stackIndex * 6,
    });
  });

  const centerStart = zoneLayout.horizontal.centerStartCol;
  const centerEnd = zoneLayout.horizontal.centerEndCol;
  const centerCols = centerEnd - centerStart + 1;

  strandInput.globalConnectionOrder.forEach((connId, orderIndex) => {
    const row = BASE_ROW + orderIndex;
    connectionRows.set(connId, row);

    const elkKey = `splice-${connId}`;
    const elkPos = elkPositions.get(elkKey);
    let col = centerStart + (orderIndex % centerCols);
    if (elkPos) {
      col = pxToGrid(elkPos.x);
      col = Math.max(centerStart, Math.min(centerEnd, col));
    }

    splicePoints.push({
      connectionId: connId,
      point: { col, row },
    });

    placements.push({
      nodeId: `splice-${connId}`,
      col,
      row,
    });
  });

  for (const group of strandInput.groups) {
    const firstConn = group.connectionIds[0];
    if (!firstConn) continue;
    const row = connectionRows.get(firstConn) ?? BASE_ROW;
    groupLanes.set(group.id, centerStart + (connectionRowIndex(strandInput.globalConnectionOrder, firstConn) % centerCols));
    void row;
  }

  for (const conn of graph.connections) {
    const row = connectionRows.get(conn.id) ?? BASE_ROW;
    placements.push(
      { nodeId: `fiber-${conn.fromFiberId}`, col: CABLE_COL_LEFT + 3, row },
      { nodeId: `fiber-${conn.toFiberId}`, col: rightStartCol - 1, row },
    );
  }

  return {
    layoutMode: "horizontal",
    zoneLayout,
    placements,
    splicePoints,
    groupLanes,
    connectionRows,
  };
}

export type { GridPoint };
