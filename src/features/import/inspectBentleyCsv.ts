import { analyzeParseFailures } from "./analyzeParseFailures";
import { cableLegIdentityFromParsed, type CableLegSummary } from "./cableLegIdentity";
import type { ParsedCsv } from "./types";

export type InspectReport = {
  fileName: string;
  spliceName: string;
  leftRawRowCount: number;
  rightRawRowCount: number;
  parsedPairCount: number;
  parseGap: number;
  failureCount: number;
  failureBreakdown: ReturnType<typeof analyzeParseFailures>;
  cableLegs: CableLegSummary[];
  readyForLayout: boolean;
  summaryLines: string[];
};

export function inspectBentleyCsv(parsed: ParsedCsv): InspectReport {
  const cableLegs = cableLegIdentityFromParsed(parsed);
  const failureBreakdown = analyzeParseFailures(parsed.failures);
  // Bidirectional duplicate listings are expected, not blocking errors.
  const blockingFailures = parsed.failures.filter((f) => f.reason !== "duplicatePair");
  const readyForLayout = parsed.parseGap === 0 && blockingFailures.length === 0;

  const summaryLines = [
    `File: ${parsed.fileName}`,
    `Splice: ${parsed.header.spliceName || "(unknown)"}`,
    `Left rows with <->: ${parsed.leftRawRowCount}`,
    `Parsed pairs: ${parsed.pairs.length}`,
    `Parse gap: ${parsed.parseGap}`,
    `Failures: ${parsed.failures.length}`,
    `Unique cable legs: ${cableLegs.length}`,
    readyForLayout ? "Status: ready for layout" : "Status: fix parse errors before layout",
  ];

  return {
    fileName: parsed.fileName,
    spliceName: parsed.header.spliceName,
    leftRawRowCount: parsed.leftRawRowCount,
    rightRawRowCount: parsed.rightRawRowCount,
    parsedPairCount: parsed.pairs.length,
    parseGap: parsed.parseGap,
    failureCount: parsed.failures.length,
    failureBreakdown,
    cableLegs,
    readyForLayout,
    summaryLines,
  };
}

export function formatInspectReport(report: InspectReport): string {
  const lines = [...report.summaryLines, ""];

  if (report.failureBreakdown.length > 0) {
    lines.push("Failure breakdown:");
    for (const item of report.failureBreakdown) {
      lines.push(`  ${item.label}: ${item.count}`);
      for (const sample of item.samples) {
        lines.push(`    line ${sample.lineNumber}: ${sample.rawLine.slice(0, 100)}`);
      }
    }
    lines.push("");
  }

  lines.push("Cable legs:");
  for (const leg of report.cableLegs) {
    lines.push(
      `  ${leg.legId} — from ${leg.fromCount}, to ${leg.toCount}, tubes [${leg.tubeColors.join(", ")}]`,
    );
  }

  return lines.join("\n");
}
