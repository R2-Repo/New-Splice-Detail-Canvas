import type { Edge, Node } from "@xyflow/react";

import { gridToPx } from "@/features/grid/coords";
import type { LaneBook } from "@/features/grid/laneBook";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { ConnectionGraph } from "@/features/diagram/types";
import { fiberColorToHex, isStripedColor, needsContrastOutline } from "@/features/diagram/fiberColorHex";
import { tubeSortIndex } from "@/features/diagram/tiaColors";
import type { LayoutResult } from "@/features/layout/types";
import type { RoutingResult } from "@/features/routing/routeConnections";

export type ReactFlowGraph = {
  nodes: Node[];
  edges: Edge[];
  zoneLayout: HorizontalZoneLayout | QuadZoneLayout | null;
  zoneMode: "horizontal" | "quad";
  laneBook: LaneBook;
};

const CABLE_BOX_W = 92;
const CABLE_BOX_H = 30;

/** Smooth breakout curve from the cable body anchor to a fiber start. */
function fanPath(ax: number, ay: number, fx: number, fy: number): string {
  const dx = (fx - ax) * 0.5;
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${fx - dx} ${fy}, ${fx} ${fy}`;
}

export function buildReactFlowGraph(
  graph: ConnectionGraph,
  layout: LayoutResult,
  routing: RoutingResult,
): ReactFlowGraph {
  const nodes: Node[] = [];

  nodes.push({
    id: "diagram-title",
    type: "title",
    position: { x: gridToPx(1), y: gridToPx(0) },
    data: {
      spliceName: graph.spliceName,
      location: graph.location,
      reportDate: graph.reportDate,
    },
  });

  const routeByConn = new Map(routing.routes.map((r) => [r.connectionId, r]));
  const fiberById = new Map(graph.fibers.map((f) => [f.id, f]));
  const placementByNode = new Map(layout.placements.map((p) => [p.nodeId, p]));

  const fibersByLeg = new Map<string, typeof graph.fibers>();
  for (const fiber of graph.fibers) {
    const list = fibersByLeg.get(fiber.legId) ?? [];
    list.push(fiber);
    fibersByLeg.set(fiber.legId, list);
  }

  const legSideById = new Map(graph.legs.map((leg) => [leg.id, leg.side]));
  const osByFiber = new Map<string, string>();
  for (const conn of graph.connections) {
    if (conn.osTag) {
      if (!osByFiber.has(conn.fromFiberId)) osByFiber.set(conn.fromFiberId, conn.osTag);
      if (!osByFiber.has(conn.toFiberId)) osByFiber.set(conn.toFiberId, conn.osTag);
    }
  }

  // Order each leg's fibers (tube order, then strand) and mark each tube's head.
  const tubeHeadIds = new Set<string>();
  const cableAnchor = new Map<string, { x: number; y: number; side: string }>();
  for (const [legId, list] of fibersByLeg) {
    list.sort(
      (a, b) =>
        tubeSortIndex(a.tubeColor) - tubeSortIndex(b.tubeColor) || a.fiberNumber - b.fiberNumber,
    );
    let lastTube: string | null = null;
    for (const fiber of list) {
      if (fiber.tubeColor !== lastTube) tubeHeadIds.add(fiber.id);
      lastTube = fiber.tubeColor;
    }
    void legId;
  }

  const fanoutEdges: Edge[] = [];

  for (const leg of graph.legs) {
    const placement = placementByNode.get(`cable-${leg.id}`);
    if (!placement) continue;
    const side = leg.side ?? "left";

    const legFibers = fibersByLeg.get(leg.id) ?? [];
    const rows = legFibers
      .map((f) => placementByNode.get(`fiber-${f.id}`)?.row)
      .filter((r): r is number => typeof r === "number");
    const minRow = rows.length ? Math.min(...rows) : placement.row;
    const maxRow = rows.length ? Math.max(...rows) : placement.row;
    const midRow = Math.round((minRow + maxRow) / 2);
    const midY = gridToPx(midRow);

    // Anchor where breakout fans converge at the cable body.
    const ax = side === "right" ? gridToPx(placement.col) : gridToPx(placement.col) + CABLE_BOX_W;
    cableAnchor.set(leg.id, { x: ax, y: midY, side });

    nodes.push({
      id: `cable-${leg.id}`,
      type: "cable",
      position: { x: gridToPx(placement.col), y: midY - CABLE_BOX_H / 2 },
      data: { label: leg.cableName, side, role: leg.role },
    });
  }

  for (const fiber of graph.fibers) {
    const placement = placementByNode.get(`fiber-${fiber.id}`);
    if (!placement) continue;
    const side = legSideById.get(fiber.legId) ?? "left";
    const fx = gridToPx(placement.col);
    const fy = gridToPx(placement.row);
    const tubeHex = fiberColorToHex(fiber.tubeColor);

    nodes.push({
      id: `fiber-${fiber.id}`,
      type: "fiberAnchor",
      position: { x: fx, y: fy },
      data: {
        fiberNumber: fiber.fiberNumber,
        tubeColor: fiber.tubeColor,
        fiberColor: fiber.fiberColor,
        color: fiberColorToHex(fiber.fiberColor),
        outline: needsContrastOutline(fiber.fiberColor),
        side,
        os: osByFiber.get(fiber.id),
        tubeHead: tubeHeadIds.has(fiber.id),
        tubeHex,
        striped: isStripedColor(fiber.tubeColor),
      },
    });

    // Breakout fan: cable body anchor -> fiber, in the tube color.
    const anchor = cableAnchor.get(fiber.legId);
    if (anchor) {
      fanoutEdges.push({
        id: `fan-${fiber.id}`,
        source: `cable-${fiber.legId}`,
        target: `fiber-${fiber.id}`,
        type: "fanout",
        data: { path: fanPath(anchor.x, anchor.y, fx, fy), color: tubeHex },
      });
    }
  }

  for (const conn of graph.connections) {
    const placement = layout.placements.find((p) => p.nodeId === `splice-${conn.id}`);
    if (!placement) continue;
    nodes.push({
      id: `splice-${conn.id}`,
      type: "splicePoint",
      position: { x: gridToPx(placement.col), y: gridToPx(placement.row) },
      data: {
        connectionId: conn.id,
        color: fiberColorToHex(fiberById.get(conn.fromFiberId)?.fiberColor),
      },
    });
  }

  const spliceEdges: Edge[] = graph.connections.map((conn) => {
    const route = routeByConn.get(conn.id);
    const fromFiber = fiberById.get(conn.fromFiberId);
    return {
      id: `edge-${conn.id}`,
      source: `fiber-${conn.fromFiberId}`,
      target: `fiber-${conn.toFiberId}`,
      type: "splice",
      data: {
        path: route?.path ?? "",
        routeError: route?.routeError,
        connectionId: conn.id,
        color: fiberColorToHex(fromFiber?.fiberColor),
        outline: needsContrastOutline(fromFiber?.fiberColor),
      },
    };
  });

  const edges: Edge[] = [...fanoutEdges, ...spliceEdges];

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
