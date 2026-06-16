import { PARSE_REASON_LABELS, type ParseReasonCode } from "./parseReasons";
import type { ParseFailure } from "./types";

export type FailureBreakdown = {
  reason: ParseReasonCode;
  label: string;
  count: number;
  samples: Array<{ lineNumber: number; rawLine: string }>;
};

export function analyzeParseFailures(failures: ParseFailure[]): FailureBreakdown[] {
  const map = new Map<ParseReasonCode, FailureBreakdown>();

  for (const failure of failures) {
    const existing = map.get(failure.reason) ?? {
      reason: failure.reason,
      label: PARSE_REASON_LABELS[failure.reason],
      count: 0,
      samples: [],
    };
    existing.count += 1;
    if (existing.samples.length < 3) {
      existing.samples.push({ lineNumber: failure.lineNumber, rawLine: failure.rawLine });
    }
    map.set(failure.reason, existing);
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}
