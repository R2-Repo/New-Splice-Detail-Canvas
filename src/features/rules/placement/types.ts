import type { DiagramSide } from "@/features/diagram/types";

/** Side + stack order for one layout candidate. Consumed by the layout engine. */
export type PlacementPlan = {
  id: string;
  sideAssignment: Map<string, DiagramSide>;
  stackOrder: Map<DiagramSide, string[]>;
};

export type PlacementCandidateResult = {
  plan: PlacementPlan;
  score: number;
  breakdown: import("@/features/routing/scoreRouting").RouteQualityBreakdown;
};
