import type { DiagramSide } from "@/features/diagram/types";

/** Confidence in an inferred value (SDC-IMPORT-001, SDC-DATA-002). */
export type Confidence = "high" | "medium" | "low" | "unknown";

export type NormalizedSeverity = "error" | "warning" | "info";

/** Actionable import/validation message (SDC-VALIDATE-001 subset). */
export type ImportMessage = {
  ruleId: string;
  severity: NormalizedSeverity;
  message: string;
  sourceRows?: number[];
  objectIds?: string[];
  suggestedFix?: string;
};

export type SourceMetadata = {
  fileName: string;
  spliceName: string;
  pairCount: number;
  leftRawRowCount: number;
  rightRawRowCount: number;
  parseGap: number;
  failureCount: number;
};

export type CableRecord = {
  /** Stable cable identity = leg id (e.g. `144-SMF ...#from`). */
  cableId: string;
  cableName: string;
  role: "through" | "drop";
  fibersPerTube: 6 | 12;
  fibersPerTubeConfidence: Confidence;
  side?: DiagramSide;
  sourceRows: number[];
};

export type BufferTubeRecord = {
  /** `${cableId}::${tubeColor}` */
  tubeId: string;
  cableId: string;
  tubeColor: string;
  fibersPerTube: 6 | 12;
  sourceRows: number[];
};

export type FiberStrandRecord = {
  /** `${tubeId}::${absoluteFiberNumber}::${fiberColor}` */
  fiberId: string;
  cableId: string;
  tubeId: string;
  tubeColor: string;
  absoluteFiberNumber: number;
  fiberColor: string;
  osCircuitName?: string;
  sourceRows: number[];
};

export type ConnectionEndpoint = {
  fiberId: string;
  cableId: string;
  tubeId: string;
  tubeColor: string;
  absoluteFiberNumber: number;
  fiberColor: string;
  osCircuitName?: string;
};

export type FusionSpliceDot = {
  /**
   * Deterministic id. Spec form is `splice:<cableId>:<strand>--<cableId>:<strand>`;
   * tube color is included to stay collision-safe across same cable+strand in
   * different tubes (SDC-CONNECT-001 "Dot Identity").
   */
  id: string;
  connectionId: string;
  endpointAFiberId: string;
  endpointBFiberId: string;
};

export type ConnectionPair = {
  /** Stable connection id from the parser (e.g. `pair-3`). */
  connectionId: string;
  endpointA: ConnectionEndpoint;
  endpointB: ConnectionEndpoint;
  fusionSpliceDot: FusionSpliceDot;
  sourceRows: number[];
};

/**
 * Normalized import model (SDC-IMPORT-001). Created once from the parsed CSV and
 * is the data source of truth for the data-stage rule modules. The existing
 * ConnectionGraph remains the contract for layout/routing.
 */
export type NormalizedImport = {
  source: SourceMetadata;
  cables: CableRecord[];
  bufferTubes: BufferTubeRecord[];
  fiberStrands: FiberStrandRecord[];
  connectionPairs: ConnectionPair[];
  fusionSpliceDots: FusionSpliceDot[];
  warnings: ImportMessage[];
  errors: ImportMessage[];
};
