import type { Edge, Node } from "@xyflow/react";

import { gridToPx } from "@/features/grid/coords";
import type { LaneBook } from "@/features/grid/laneBook";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { LayoutResult } from "@/features/layout/types";
import type { RoutingResult } from "@/features/routing/routeConnections";

export type ReactFlowGraph = {
  nodes: Node[];
  edges: Edge[];
  zoneLayout: HorizontalZoneLayout | QuadZoneLayout | null;
  zoneMode: "horizontal" | "quad";
  laneBook: LaneBook;
};

export function buildReactFlowGraph(
  graph: ConnectionGraph,
  layout: LayoutResult,
  routing: RoutingResult,
): ReactFlowGraph {
  const nodes: Node[] = [];
  const routeByConn = new Map(routing.routes.map((r) => [r.connectionId, r]));

  for (const leg of graph.legs) {
    const placement = layout.placements.find((p) => p.nodeId === `cable-${leg.id}`);
    if (!placement) continue;
    nodes.push({
      id: `cable-${leg.id}`,
      type: "cable",
      position: { x: gridToPx(placement.col), y: gridToPx(placement.row) },
      data: {
        label: leg.cableName,
        side: leg.side ?? "left",
        role: leg.role,
      },
    });
  }

  for (const fiber of graph.fibers) {
    const placement = layout.placements.find((p) => p.nodeId === `fiber-${fiber.id}`);
    if (!placement) continue;
    nodes.push({
      id: `fiber-${fiber.id}`,
      type: "fiberAnchor",
      position: { x: gridToPx(placement.col), y: gridToPx(placement.row) },
      data: {
        fiberNumber: fiber.fiberNumber,
        tubeColor: fiber.tubeColor,
        fiberColor: fiber.fiberColor,
      },
    });
  }

  for (const conn of graph.connections) {
    const placement = layout.placements.find((p) => p.nodeId === `splice-${conn.id}`);
    if (!placement) continue;
    nodes.push({
      id: `splice-${conn.id}`,
      type: "splicePoint",
      position: { x: gridToPx(placement.col), y: gridToPx(placement.row) },
      data: { connectionId: conn.id },
    });
  }

  const edges: Edge[] = graph.connections.map((conn) => {
    const route = routeByConn.get(conn.id);
    return {
      id: `edge-${conn.id}`,
      source: `fiber-${conn.fromFiberId}`,
      target: `fiber-${conn.toFiberId}`,
      type: "splice",
      data: {
        path: route?.path ?? "",
        routeError: route?.routeError,
        connectionId: conn.id,
      },
    };
  });

  const zoneLayout =
    layout.zoneLayout.mode === "horizontal"
      ? layout.zoneLayout.horizontal
      : layout.zoneLayout.quad;

  return {
    nodes,
    edges,
    zoneLayout,
    zoneMode: layout.layoutMode,
    laneBook: routing.laneBook,
  };
}
