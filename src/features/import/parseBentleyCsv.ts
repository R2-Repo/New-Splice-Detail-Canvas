import { canonicalPairKey, parseBentleyRow } from "./bentleyRow";
import type { ParseReasonCode } from "./parseReasons";
import type { CsvEndpoint, CsvHeader, ParseFailure, ParsedCsv, SplicePairRow } from "./types";

function parseHeader(lines: string[]): CsvHeader {
  const header: CsvHeader = { spliceName: "" };

  for (const line of lines.slice(0, 15)) {
    const nameMatch = line.match(/Name:\s*(.+?)\s+ID:/i);
    if (nameMatch?.[1]) header.spliceName = nameMatch[1].trim();

    const dateMatch = line.match(/Report Date:\s*(.+)$/i);
    if (dateMatch?.[1]) header.reportDate = dateMatch[1].trim();

    const locMatch = line.match(/^Location:\s*(.+)$/i);
    if (locMatch?.[1]) header.location = locMatch[1].trim();

    const deviceMatch = line.match(/Device Type:\s*(\S+)/i);
    if (deviceMatch?.[1]) header.deviceType = deviceMatch[1].trim();

    const modelMatch = line.match(/Model:\s*(.+?)\s+Name:/i);
    if (modelMatch?.[1]) header.model = modelMatch[1].trim();

    const descMatch = line.match(/Desc:\s*(.+)$/i);
    if (descMatch?.[1]) header.description = descMatch[1].trim();

    const spliceHashMatch = line.match(/Splice#:\s*(.+)$/i);
    if (spliceHashMatch?.[1] && !header.spliceName) {
      header.spliceName = spliceHashMatch[1].trim();
    }
  }

  return header;
}

function classifyRowFailure(line: string): ParseReasonCode {
  if (!line.includes("<->")) return "missingArrow";

  const parsed = parseBentleyRow(line);
  if (!parsed) {
    if (!line.includes(",")) return "missingFromFields";
    return "missingToFields";
  }

  if (!parsed.endpointA.cableName || !parsed.endpointB.cableName) return "missingCableName";
  if (!parsed.endpointA.tubeColor || !parsed.endpointB.tubeColor) return "missingTubeColor";
  if (!parsed.endpointA.fiberColor || !parsed.endpointB.fiberColor) return "missingFiberColor";
  if (!parsed.endpointA.fiberNumber && !parsed.endpointB.fiberNumber) return "missingFiberNumber";

  return "missingToFields";
}

export function parseBentleyCsv(csvText: string, fileName = "import.csv"): ParsedCsv {
  const lines = csvText.split(/\r?\n/);
  const header = parseHeader(lines);

  let section: "none" | "left" | "right" = "none";
  let leftRawRowCount = 0;
  let rightRawRowCount = 0;
  const failures: ParseFailure[] = [];
  const pairs: SplicePairRow[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();

    if (trimmed === "Left ---") {
      section = "left";
      continue;
    }
    if (trimmed === "Right ---") {
      section = "right";
      continue;
    }
    if (section === "none" || !trimmed.includes("<->")) continue;

    if (section === "left") leftRawRowCount += 1;
    if (section === "right") rightRawRowCount += 1;

    // Right section is hints only — never create pairs from it.
    if (section === "right") continue;

    const parsed = parseBentleyRow(rawLine);
    if (!parsed) {
      failures.push({
        lineNumber: i + 1,
        rawLine,
        reason: classifyRowFailure(rawLine),
      });
      continue;
    }

    const { endpointA, endpointB } = parsed;
    if (!endpointA.cableName || !endpointB.cableName) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "missingCableName" });
      continue;
    }
    if (!endpointA.tubeColor || !endpointB.tubeColor) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "missingTubeColor" });
      continue;
    }
    if (!endpointA.fiberColor || !endpointB.fiberColor) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "missingFiberColor" });
      continue;
    }
    if (!endpointA.fiberNumber && !endpointB.fiberNumber) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "missingFiberNumber" });
      continue;
    }
    if (!endpointB.fiberNumber) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "missingFiberNumber" });
      continue;
    }

    const pairKey = canonicalPairKey(endpointA, endpointB);
    if (seenKeys.has(pairKey)) {
      failures.push({ lineNumber: i + 1, rawLine, reason: "duplicatePair" });
      continue;
    }
    seenKeys.add(pairKey);

    pairs.push({
      id: `pair-${pairs.length + 1}`,
      lineNumber: i + 1,
      rawLine,
      endpointA,
      endpointB,
    });
  }

  const parseGap = failures.filter((f) => f.reason !== "duplicatePair").length;

  return {
    fileName,
    header,
    pairs,
    leftRawRowCount,
    rightRawRowCount,
    failures,
    parseGap,
  };
}

export function assignLegIdsToPairs(pairs: SplicePairRow[]): SplicePairRow[] {
  const fromCounts = new Map<string, number>();
  const toCounts = new Map<string, number>();

  for (const pair of pairs) {
    fromCounts.set(pair.endpointA.cableName, (fromCounts.get(pair.endpointA.cableName) ?? 0) + 1);
    toCounts.set(pair.endpointB.cableName, (toCounts.get(pair.endpointB.cableName) ?? 0) + 1);
  }

  return pairs.map((pair) => {
    const aLeg = legIdForCable(pair.endpointA.cableName, "from", fromCounts, toCounts);
    const bLeg = legIdForCable(pair.endpointB.cableName, "to", fromCounts, toCounts);
    return {
      ...pair,
      endpointA: { ...pair.endpointA, legId: aLeg },
      endpointB: { ...pair.endpointB, legId: bLeg },
    };
  });
}

function legIdForCable(
  cableName: string,
  column: "from" | "to",
  fromCounts: Map<string, number>,
  toCounts: Map<string, number>,
): string {
  const fromN = fromCounts.get(cableName) ?? 0;
  const toN = toCounts.get(cableName) ?? 0;

  if (fromN > 0 && toN > 0) {
    return `${cableName}#${column}`;
  }
  return `${cableName}#leg`;
}

export function enrichParsedCsv(parsed: ParsedCsv): ParsedCsv {
  return { ...parsed, pairs: assignLegIdsToPairs(parsed.pairs) };
}

export type { CsvEndpoint };
