import type { ConnectionGraph, LayoutMode } from "@/features/diagram/types";
import { classifyStrandGroups } from "@/features/diagram/strandGroups";
import { runLayoutEngine } from "@/features/layout/runLayoutEngine";
import type { LayoutResult } from "@/features/layout/types";
import { routeConnections, type RoutingResult } from "@/features/routing/routeConnections";
import {
  scoreRoutingFromParts,
  type RouteQualityBreakdown,
} from "@/features/routing/scoreRouting";

import { generatePlacementCandidates } from "./generateCandidates";
import type { PlacementCandidateResult, PlacementPlan } from "./types";

export type OptimizedLayoutResult = {
  plan: PlacementPlan;
  layout: LayoutResult;
  routing: RoutingResult;
  breakdown: RouteQualityBreakdown;
};

export async function pickBestLayout(
  graph: ConnectionGraph,
  layoutMode: LayoutMode,
): Promise<OptimizedLayoutResult> {
  const candidates = generatePlacementCandidates(graph, layoutMode);
  const strandInput = classifyStrandGroups(graph);

  let best: OptimizedLayoutResult | null = null;

  for (const plan of candidates) {
    const layout = await runLayoutEngine(graph, {
      layoutMode,
      placementPlan: plan,
      strandInput,
    });
    const routing = routeConnections(graph, layout);
    const breakdown = scoreRoutingFromParts(graph, layout, routing, undefined, plan.id);

    if (breakdown.rejected) continue;

    if (!best || breakdown.score < best.breakdown.score) {
      best = { plan, layout, routing, breakdown };
    }
  }

  if (!best) {
    const layout = await runLayoutEngine(graph, { layoutMode, strandInput });
    const routing = routeConnections(graph, layout);
    const breakdown = scoreRoutingFromParts(graph, layout, routing);
    return {
      plan: { id: "fallback", sideAssignment: new Map(), stackOrder: new Map() },
      layout,
      routing,
      breakdown,
    };
  }

  return best;
}

export async function compareLayoutModes(
  graph: ConnectionGraph,
): Promise<{
  horizontal: OptimizedLayoutResult;
  quad: OptimizedLayoutResult;
}> {
  const [horizontal, quad] = await Promise.all([
    pickBestLayout(graph, "horizontal"),
    pickBestLayout(graph, "quad"),
  ]);
  return { horizontal, quad };
}

export type { PlacementCandidateResult, PlacementPlan };
