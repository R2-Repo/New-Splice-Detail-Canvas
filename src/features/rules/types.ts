import type { Edge, Node } from "@xyflow/react";

import type { ConnectionGraph, LayoutMode } from "@/features/diagram/types";
import type { LaneBook } from "@/features/grid/laneBook";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { NormalizedImport } from "@/features/import/normalize";
import type { ManualLock } from "@/features/interaction/manualLocks";
import type { LayoutResult } from "@/features/layout/types";
import type { RoutingResult } from "@/features/routing/routeConnections";

/** Rule identifier. Code modules use the lowercase SDC id, e.g. `sdc-import-001`. */
export type RuleId = string & { readonly __brand: "RuleId" };

export function ruleId(id: string): RuleId {
  return id as RuleId;
}

export type RuleStage = "data" | "layout" | "routing" | "full";

/** Severity per SDC-VALIDATE-001. Missing severity is treated as `error`. */
export type RuleSeverity = "error" | "warning" | "info";

export type RuleViolation = {
  ruleId: RuleId;
  message: string;
  path?: string;
  /** Defaults to `error` when omitted. Only `error` fails the run. */
  severity?: RuleSeverity;
  objectType?: string;
  objectIds?: string[];
  sourceRows?: number[];
  suggestedFix?: string;
};

/** A violation is an error unless explicitly downgraded. */
export function isError(violation: RuleViolation): boolean {
  return (violation.severity ?? "error") === "error";
}

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
  /** Normalized import model for data-stage rules. Absent for hand-built fixtures. */
  normalizedImport?: NormalizedImport;
  layout: LayoutResult;
  routing: RoutingResult;
  manualLocks?: ManualLock[];
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
  /** True when no error-severity violations were produced. */
  passed: boolean;
  violations: RuleViolation[];
  errors: RuleViolation[];
  warnings: RuleViolation[];
  resultsByRule: Map<RuleId, RuleViolation[]>;
};
