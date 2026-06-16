export const PARSE_REASON_LABELS = {
  missingArrow: "Missing <-> splice marker",
  missingFromFields: "Could not parse From-side fields",
  missingToFields: "Could not parse To-side fields",
  missingCableName: "Missing cable name",
  missingTubeColor: "Missing buffer tube color",
  missingFiberColor: "Missing fiber color",
  missingFiberNumber: "Missing fiber number on both sides",
  invalidFiberNumber: "Invalid fiber number",
  duplicatePair: "Duplicate splice pair in Left section",
} as const;

export type ParseReasonCode = keyof typeof PARSE_REASON_LABELS;
