import type { ParseReasonCode } from "./parseReasons";

export type CsvColumn = "from" | "to";

export type CsvEndpoint = {
  /** Parsed for row structure only — not used in graph, layout, or rules. */
  device?: string;
  cableName: string;
  fiberNumber: number;
  tubeColor: string;
  fiberColor: string;
  osTag?: string;
  csvColumn: CsvColumn;
  legId?: string;
};

export type SplicePairRow = {
  id: string;
  lineNumber: number;
  rawLine: string;
  endpointA: CsvEndpoint;
  endpointB: CsvEndpoint;
};

export type ParseFailure = {
  lineNumber: number;
  rawLine: string;
  reason: ParseReasonCode;
  detail?: string;
};

export type CsvHeader = {
  spliceName: string;
  location?: string;
  reportDate?: string;
  deviceType?: string;
  model?: string;
  description?: string;
};

export type ParsedCsv = {
  fileName: string;
  header: CsvHeader;
  pairs: SplicePairRow[];
  leftRawRowCount: number;
  rightRawRowCount: number;
  failures: ParseFailure[];
  /** Left rows with `<->` minus successful unique pairs. Must be 0 before layout. */
  parseGap: number;
};
