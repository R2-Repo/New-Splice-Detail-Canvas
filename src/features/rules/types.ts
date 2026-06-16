import type { Edge, Node } from "@xyflow/react";

import type { ConnectionGraph, LayoutMode } from "@/features/diagram/types";
import type { LaneBook } from "@/features/grid/laneBook";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { LayoutResult } from "@/features/layout/types";
import type { RoutingResult } from "@/features/routing/routeConnections";

/** User-assigned kebab-case rule identifier, e.g. `fiber-pitch-24px`. */
export type RuleId = string & { readonly __brand: "RuleId" };

export function ruleId(id: string): RuleId {
  return id as RuleId;
}

export type RuleStage = "layout" | "routing" | "full";

export type RuleViolation = {
  ruleId: RuleId;
  message: string;
  path?: string;
};

export type ReactFlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  zoneLayout: HorizontalZoneLayout | QuadZoneLayout | null;
  zoneMode: "horizontal" | "quad";
  laneBook: LaneBook;
};

/** Full pipeline output for rule checks. */
export type DiagramSnapshot = {
  layoutMode: LayoutMode;
  connectionGraph: ConnectionGraph;
  layout: LayoutResult;
  routing: RoutingResult;
  reactFlow: ReactFlowSnapshot;
};

export type RuleModule = {
  id: RuleId;
  title: string;
  stage: RuleStage;
  /** Return empty array when the rule passes. */
  check: (snapshot: DiagramSnapshot) => RuleViolation[];
};

export type RunRulesOptions = {
  only?: RuleId[];
};

export type RunRulesResult = {
  passed: boolean;
  violations: RuleViolation[];
  resultsByRule: Map<RuleId, RuleViolation[]>;
};
