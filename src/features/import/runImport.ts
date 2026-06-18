import type { Edge, Node } from "@xyflow/react";

import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import type { ConnectionGraph, LayoutMode } from "@/features/diagram/types";
import { LaneBook } from "@/features/grid/laneBook";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { runLayoutEngine } from "@/features/layout/runLayoutEngine";
import type { LayoutResult } from "@/features/layout/types";
import { pickBestLayout } from "@/features/rules/placement/pickBestLayout";
import { routeConnections, type RoutingResult } from "@/features/routing/routeConnections";
import type { RouteQualityBreakdown } from "@/features/routing/scoreRouting";

import { detectImportFormat } from "./detectImportFormat";
import { normalizeImport } from "./normalize";
import type { NormalizedImport } from "./normalize";
import { enrichParsedCsv, parseBentleyCsv } from "./parseBentleyCsv";
import { inspectBentleyCsv, type InspectReport } from "./inspectBentleyCsv";
import { parseSdcJson } from "./parseSdcJson";

export type ImportResult = {
  nodes: Node[];
  edges: Edge[];
  zoneLayout: HorizontalZoneLayout | QuadZoneLayout | null;
  zoneMode: "horizontal" | "quad";
  laneBook: LaneBook;
  connectionGraph: ConnectionGraph;
  /** Normalized import model (SDC-IMPORT-001) when built from a CSV. */
  normalizedImport?: NormalizedImport;
  inspectReport: InspectReport | null;
  layoutMode: LayoutMode;
  layout: LayoutResult;
  routing: RoutingResult;
  placementPlanId?: string;
  routeScore?: RouteQualityBreakdown;
  error?: string;
};

export type RunImportOptions = {
  layoutMode?: LayoutMode;
  /** When true (default), try placement candidates and pick lowest route score. */
  optimizeLayout?: boolean;
};

const EMPTY_LAYOUT: LayoutResult = {
  layoutMode: "horizontal",
  zoneLayout: {
    mode: "horizontal",
    horizontal: {
      leftEndCol: 0,
      centerStartCol: 0,
      centerEndCol: 0,
      rightStartCol: 0,
    },
  },
  placements: [],
  splicePoints: [],
  groupLanes: new Map(),
  connectionRows: new Map(),
};

function emptyRouting(): RoutingResult {
  return { laneBook: new LaneBook(), routes: [] };
}

const EMPTY_GRAPH: ConnectionGraph = {
  spliceName: "",
  legs: [],
  tubes: [],
  fibers: [],
  connections: [],
};

export async function runImport(
  text: string,
  fileName: string,
  options: RunImportOptions = {},
): Promise<ImportResult> {
  const format = detectImportFormat(text, fileName);

  if (format === "sdc-json") {
    return runJsonImport(text, options);
  }

  if (format === "csv" || format === "unknown") {
    return runCsvImport(text, fileName, options);
  }

  return emptyErrorResult(`Unsupported import format for ${fileName}`);
}

async function runCsvImport(
  text: string,
  fileName: string,
  options: RunImportOptions,
): Promise<ImportResult> {
  const parsed = enrichParsedCsv(parseBentleyCsv(text, fileName));
  const inspectReport = inspectBentleyCsv(parsed);
  const normalizedImport = normalizeImport(parsed);

  if (!inspectReport.readyForLayout) {
    return {
      nodes: [],
      edges: [],
      zoneLayout: null,
      zoneMode: "horizontal",
      laneBook: new LaneBook(),
      connectionGraph: EMPTY_GRAPH,
      normalizedImport,
      inspectReport,
      layoutMode: options.layoutMode ?? "horizontal",
      layout: EMPTY_LAYOUT,
      routing: emptyRouting(),
      error: `CSV parse not ready: gap=${parsed.parseGap}, failures=${parsed.failures.length}`,
    };
  }

  const connectionGraph = buildConnectionGraph(parsed);
  return finalizeImport(
    connectionGraph,
    inspectReport,
    options.layoutMode ?? "horizontal",
    undefined,
    options.optimizeLayout !== false,
    normalizedImport,
  );
}

async function runJsonImport(text: string, options: RunImportOptions): Promise<ImportResult> {
  const result = parseSdcJson(text);
  if (!result.ok) {
    return emptyErrorResult(result.error);
  }

  const doc = result.document;
  let connectionGraph: ConnectionGraph;
  let normalizedImport: NormalizedImport | undefined;

  if (doc.connectionGraph) {
    connectionGraph = doc.connectionGraph;
  } else if (doc.sourceCsv) {
    const parsed = enrichParsedCsv(parseBentleyCsv(doc.sourceCsv, doc.sourceFileName ?? "embedded.csv"));
    connectionGraph = buildConnectionGraph(parsed);
    normalizedImport = normalizeImport(parsed);
  } else {
    return emptyErrorResult("JSON missing connectionGraph or sourceCsv");
  }

  const layoutMode = options.layoutMode ?? doc.layoutMode ?? "horizontal";
  return finalizeImport(
    connectionGraph,
    null,
    layoutMode,
    doc.nodePositions,
    options.optimizeLayout !== false && !doc.nodePositions,
    normalizedImport,
  );
}

async function finalizeImport(
  connectionGraph: ConnectionGraph,
  inspectReport: InspectReport | null,
  layoutMode: LayoutMode,
  nodePositions?: Record<string, { x: number; y: number }>,
  optimizeLayout = true,
  normalizedImport?: NormalizedImport,
): Promise<ImportResult> {
  let layout: LayoutResult;
  let routing: RoutingResult;
  let placementPlanId: string | undefined;
  let routeScore: RouteQualityBreakdown | undefined;

  if (optimizeLayout && !nodePositions) {
    const optimized = await pickBestLayout(connectionGraph, layoutMode);
    layout = optimized.layout;
    routing = optimized.routing;
    placementPlanId = optimized.plan.id;
    routeScore = optimized.breakdown;
  } else {
    layout = await runLayoutEngine(connectionGraph, { layoutMode });
    routing = routeConnections(connectionGraph, layout);
  }

  if (nodePositions) {
    for (const [nodeId, pos] of Object.entries(nodePositions)) {
      const existing = layout.placements.find((p) => p.nodeId === nodeId);
      if (existing) {
        existing.col = Math.round(pos.x / 24);
        existing.row = Math.round(pos.y / 24);
      }
    }
    routing = routeConnections(connectionGraph, layout);
  }

  const rf = buildReactFlowGraph(connectionGraph, layout, routing);

  return {
    nodes: rf.nodes,
    edges: rf.edges,
    zoneLayout: rf.zoneLayout,
    zoneMode: rf.zoneMode,
    laneBook: rf.laneBook,
    connectionGraph,
    normalizedImport,
    inspectReport,
    layoutMode,
    layout,
    routing,
    placementPlanId,
    routeScore,
  };
}

function emptyErrorResult(error: string): ImportResult {
  return {
    nodes: [],
    edges: [],
    zoneLayout: null,
    zoneMode: "horizontal",
    laneBook: new LaneBook(),
    connectionGraph: EMPTY_GRAPH,
    inspectReport: null,
    layoutMode: "horizontal",
    layout: EMPTY_LAYOUT,
    routing: emptyRouting(),
    error,
  };
}
