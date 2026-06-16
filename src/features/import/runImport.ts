import type { Edge, Node } from "@xyflow/react";

import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import type { ConnectionGraph, LayoutMode } from "@/features/diagram/types";
import { LaneBook } from "@/features/grid/laneBook";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import { runLayoutEngine } from "@/features/layout/runLayoutEngine";
import { routeConnections } from "@/features/routing/routeConnections";

import { detectImportFormat } from "./detectImportFormat";
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
  inspectReport: InspectReport | null;
  layoutMode: LayoutMode;
  error?: string;
};

export type RunImportOptions = {
  layoutMode?: LayoutMode;
};

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

  if (!inspectReport.readyForLayout) {
    return {
      nodes: [],
      edges: [],
      zoneLayout: null,
      zoneMode: "horizontal",
      laneBook: new LaneBook(),
      connectionGraph: EMPTY_GRAPH,
      inspectReport,
      layoutMode: options.layoutMode ?? "horizontal",
      error: `CSV parse not ready: gap=${parsed.parseGap}, failures=${parsed.failures.length}`,
    };
  }

  const connectionGraph = buildConnectionGraph(parsed);
  return finalizeImport(connectionGraph, inspectReport, options.layoutMode ?? "horizontal", undefined);
}

async function runJsonImport(text: string, options: RunImportOptions): Promise<ImportResult> {
  const result = parseSdcJson(text);
  if (!result.ok) {
    return emptyErrorResult(result.error);
  }

  const doc = result.document;
  let connectionGraph: ConnectionGraph;

  if (doc.connectionGraph) {
    connectionGraph = doc.connectionGraph;
  } else if (doc.sourceCsv) {
    const parsed = enrichParsedCsv(parseBentleyCsv(doc.sourceCsv, doc.sourceFileName ?? "embedded.csv"));
    connectionGraph = buildConnectionGraph(parsed);
  } else {
    return emptyErrorResult("JSON missing connectionGraph or sourceCsv");
  }

  const layoutMode = options.layoutMode ?? doc.layoutMode ?? "horizontal";
  return finalizeImport(connectionGraph, null, layoutMode, doc.nodePositions);
}

async function finalizeImport(
  connectionGraph: ConnectionGraph,
  inspectReport: InspectReport | null,
  layoutMode: LayoutMode,
  nodePositions?: Record<string, { x: number; y: number }>,
): Promise<ImportResult> {
  const layout = await runLayoutEngine(connectionGraph, {
    layoutMode,
    overrides: { nodePositions },
  });

  if (nodePositions) {
    for (const [nodeId, pos] of Object.entries(nodePositions)) {
      const existing = layout.placements.find((p) => p.nodeId === nodeId);
      if (existing) {
        existing.col = Math.round(pos.x / 24);
        existing.row = Math.round(pos.y / 24);
      }
    }
  }

  const routing = routeConnections(connectionGraph, layout);
  const rf = buildReactFlowGraph(connectionGraph, layout, routing);

  return {
    nodes: rf.nodes,
    edges: rf.edges,
    zoneLayout: rf.zoneLayout,
    zoneMode: rf.zoneMode,
    laneBook: rf.laneBook,
    connectionGraph,
    inspectReport,
    layoutMode,
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
    error,
  };
}
