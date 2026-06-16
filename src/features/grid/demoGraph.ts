import type { Edge, Node } from "@xyflow/react";

import {
  DEFAULT_DEMO_ZONE_LAYOUT,
  demoPlacementsFromImport,
  gridPointFromPlacement,
  gridToPx,
  LaneBook,
  routeHorizontalSpliceLeg,
  type HorizontalZoneLayout,
} from "@/features/grid";

export type DemoGridGraph = {
  nodes: Node[];
  edges: Edge[];
  zoneLayout: HorizontalZoneLayout;
  laneBook: LaneBook;
};

export function buildDemoGridGraph(
  csvText = "",
  fileName = "demo",
): DemoGridGraph {
  const zoneLayout = DEFAULT_DEMO_ZONE_LAYOUT;
  const placements = demoPlacementsFromImport(csvText, fileName);
  const sourcePlacement = placements.find((p) => p.nodeId === "demo-source");
  const targetPlacement = placements.find((p) => p.nodeId === "demo-target");

  if (!sourcePlacement || !targetPlacement) {
    throw new Error("Demo placements missing source or target");
  }

  const laneBook = new LaneBook();
  const source = gridPointFromPlacement(sourcePlacement);
  const target = gridPointFromPlacement(targetPlacement);
  const route = routeHorizontalSpliceLeg(source, target, zoneLayout, laneBook);

  const routePath = "path" in route ? route.path : "";
  const routeError = "code" in route ? route.message : undefined;

  const nodes: Node[] = placements.map((p) => ({
    id: p.nodeId,
    type: "demoAnchor",
    position: { x: gridToPx(p.col), y: gridToPx(p.row) },
    data: {
      label: p.nodeId === "demo-source" ? "Source" : "Target",
      gridCol: p.col,
      gridRow: p.row,
    },
  }));

  const edges: Edge[] = [
    {
      id: "demo-splice-leg",
      source: "demo-source",
      target: "demo-target",
      type: "demoSplice",
      data: {
        path: routePath,
        routeError,
        midXCol: "midXCol" in route ? route.midXCol : null,
      },
    },
  ];

  return { nodes, edges, zoneLayout, laneBook };
}
