import type { LayoutMode } from "@/features/diagram/types";
import { LaneBook } from "@/features/grid/laneBook";
import { runImport } from "@/features/import/runImport";

import {
  readReferenceExampleCsv,
  readSp3254TeachingCsv,
  referenceExampleFileName,
  sp3254TeachingFileName,
  type BuildSnapshotOptions,
  type ReferenceExampleId,
} from "./referenceExamples";
import type { DiagramSnapshot } from "./types";

export type { BuildSnapshotOptions, ReferenceExampleId };

export async function buildSnapshotFromText(
  text: string,
  fileName: string,
  options: BuildSnapshotOptions = {},
): Promise<DiagramSnapshot> {
  const layoutMode = options.layoutMode ?? "horizontal";
  const result = await runImport(text, fileName, {
    layoutMode,
    optimizeLayout: options.optimizeLayout,
  });

  if (result.error) {
    throw new Error(`Import failed for ${fileName}: ${result.error}`);
  }

  return {
    layoutMode: result.layoutMode,
    connectionGraph: result.connectionGraph,
    normalizedImport: result.normalizedImport,
    layout: result.layout,
    routing: result.routing,
    reactFlow: {
      nodes: result.nodes,
      edges: result.edges,
      zoneLayout: result.zoneLayout,
      zoneMode: result.zoneMode,
      laneBook: result.laneBook,
    },
  };
}

export async function buildSnapshotFromExample(
  exampleId: ReferenceExampleId,
  options: BuildSnapshotOptions = {},
): Promise<DiagramSnapshot> {
  const text = readReferenceExampleCsv(exampleId);
  return buildSnapshotFromText(text, referenceExampleFileName(exampleId), options);
}

export async function buildSnapshotFromSp3254(
  options: BuildSnapshotOptions = {},
): Promise<DiagramSnapshot> {
  const text = readSp3254TeachingCsv();
  return buildSnapshotFromText(text, sp3254TeachingFileName(), options);
}

export function emptySnapshot(layoutMode: LayoutMode = "horizontal"): DiagramSnapshot {
  return {
    layoutMode,
    connectionGraph: {
      spliceName: "",
      legs: [],
      tubes: [],
      fibers: [],
      connections: [],
    },
    layout: {
      layoutMode,
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
      fanoutExits: new Map(),
      connectionMidCols: new Map(),
    },
    routing: {
      laneBook: new LaneBook(),
      routes: [],
    },
    reactFlow: {
      nodes: [],
      edges: [],
      zoneLayout: null,
      zoneMode: "horizontal",
      laneBook: new LaneBook(),
    },
  };
}
