import type { ElkNode } from "elkjs/lib/elk-api";

import { GRID_PITCH, TUBE_GROUP_GAP } from "@/features/grid/constants";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";

import type { SideAssignment } from "../assignCableSides";

export type ElkBuildInput = {
  graph: ConnectionGraph;
  strandInput: StrandGroupLayoutInput;
  sideAssignment: SideAssignment;
  layoutMode: "horizontal" | "quad";
};

export function buildElkGraph(input: ElkBuildInput): ElkNode {
  const { graph, strandInput, sideAssignment, layoutMode } = input;
  const children: ElkNode[] = [];
  const edges: NonNullable<ElkNode["edges"]> = [];

  const rowByConn = new Map<string, number>();
  strandInput.globalConnectionOrder.forEach((id, row) => rowByConn.set(id, row));

  for (const leg of graph.legs) {
    const side = sideAssignment.get(leg.id) ?? "left";
    const legConns = graph.connections.filter((c) => c.fromLegId === leg.id || c.toLegId === leg.id);
    const height = Math.max(1, legConns.length) * GRID_PITCH + TUBE_GROUP_GAP;

    children.push({
      id: `cable-${leg.id}`,
      width: GRID_PITCH * 4,
      height,
      layoutOptions: {
        "elk.portConstraints": "FIXED_SIDE",
        "elk.nodeLabels.placement": "INSIDE V_CENTER H_LEFT",
      },
      labels: [{ text: leg.cableName }],
      ports: legConns.map((conn, i) => ({
        id: `port-${leg.id}-${conn.id}`,
        width: 1,
        height: 1,
        layoutOptions: {
          "elk.port.side": sideToElkPort(side, layoutMode),
        },
        index: i,
      })),
    });
  }

  for (const conn of graph.connections) {
    const row = rowByConn.get(conn.id) ?? 0;
    const spliceId = `splice-${conn.id}`;
    children.push({
      id: spliceId,
      width: GRID_PITCH,
      height: GRID_PITCH,
      layoutOptions: {
        "elk.layered.priority": String(1000 - row),
      },
    });

    edges.push(
      {
        id: `edge-from-${conn.id}`,
        sources: [`port-${conn.fromLegId}-${conn.id}`],
        targets: [spliceId],
      },
      {
        id: `edge-to-${conn.id}`,
        sources: [spliceId],
        targets: [`port-${conn.toLegId}-${conn.id}`],
      },
    );
  }

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": layoutMode === "horizontal" ? "RIGHT" : "DOWN",
      "elk.spacing.nodeNode": String(GRID_PITCH),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(GRID_PITCH * 2),
      "elk.spacing.edgeEdge": String(TUBE_GROUP_GAP),
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    },
    children,
    edges,
  };
}

function sideToElkPort(side: string, layoutMode: "horizontal" | "quad"): string {
  if (layoutMode === "horizontal") {
    return side === "left" ? "EAST" : "WEST";
  }
  switch (side) {
    case "top":
      return "SOUTH";
    case "bottom":
      return "NORTH";
    case "right":
      return "WEST";
    default:
      return "EAST";
  }
}

export function elkNodeCenter(node: ElkNode): { x: number; y: number } {
  const x = (node.x ?? 0) + (node.width ?? 0) / 2;
  const y = (node.y ?? 0) + (node.height ?? 0) / 2;
  return { x, y };
}
