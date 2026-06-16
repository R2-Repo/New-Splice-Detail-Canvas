import type { ConnectionGraph } from "@/features/diagram/types";
import { classifyStrandGroups } from "@/features/diagram/strandGroups";

import { computeHorizontalLayout } from "./horizontal/computeHorizontalLayout";
import { computeQuadLayout } from "./quad/computeQuadLayout";
import type { LayoutOptions, LayoutResult } from "./types";

export async function runLayoutEngine(
  graph: ConnectionGraph,
  options: LayoutOptions,
): Promise<LayoutResult> {
  const strandInput = options.strandInput ?? classifyStrandGroups(graph);

  if (options.layoutMode === "quad") {
    return computeQuadLayout(graph, strandInput, options.placementPlan);
  }

  return computeHorizontalLayout(graph, strandInput, options.placementPlan);
}
