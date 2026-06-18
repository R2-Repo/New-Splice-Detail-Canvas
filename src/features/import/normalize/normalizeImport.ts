import {
  cableLegIdentityFromParsed,
  inferLegRole,
  type CableLegSummary,
} from "../cableLegIdentity";
import { enrichParsedCsv } from "../parseBentleyCsv";
import type { CsvEndpoint, ParsedCsv } from "../types";

import type {
  BufferTubeRecord,
  CableRecord,
  Confidence,
  ConnectionEndpoint,
  ConnectionPair,
  FiberStrandRecord,
  FusionSpliceDot,
  ImportMessage,
  NormalizedImport,
} from "./types";

function inferCountWithConfidence(summary: CableLegSummary | undefined): {
  count: 6 | 12;
  confidence: Confidence;
} {
  if (!summary) return { count: 12, confidence: "unknown" };
  const tubeCount = summary.tubeColors.length;
  if (tubeCount === 0) return { count: 12, confidence: "unknown" };

  const avg = summary.fiberRange.max / tubeCount;
  const count: 6 | 12 = avg <= 6.5 ? 6 : 12;
  const ratio = avg / count;
  const confidence: Confidence = ratio > 0.75 ? "high" : ratio > 0.4 ? "medium" : "low";
  return { count, confidence };
}

function endpointLegId(endpoint: CsvEndpoint, fallbackColumn: "from" | "to"): string {
  return endpoint.legId ?? `${endpoint.cableName}#${fallbackColumn}`;
}

/**
 * Build the normalized import model (SDC-IMPORT-001) from a parsed Bentley CSV.
 * Preserves source rows, absolute strand numbers, and connection identity; infers
 * buffer tube count per cable; and creates one fusion splice dot per pair.
 */
export function normalizeImport(parsedInput: ParsedCsv): NormalizedImport {
  const parsed = enrichParsedCsv(parsedInput);
  const summaries = cableLegIdentityFromParsed(parsed);
  const summaryByLeg = new Map(summaries.map((summary) => [summary.legId, summary]));

  const cables = new Map<string, CableRecord>();
  const tubes = new Map<string, BufferTubeRecord>();
  const fibers = new Map<string, FiberStrandRecord>();
  const connectionPairs: ConnectionPair[] = [];
  const fusionSpliceDots: FusionSpliceDot[] = [];
  const warnings: ImportMessage[] = [];
  const errors: ImportMessage[] = [];

  function ensureCable(cableId: string, cableName: string, row: number): CableRecord {
    let cable = cables.get(cableId);
    if (!cable) {
      const summary = summaryByLeg.get(cableId);
      const { count, confidence } = inferCountWithConfidence(summary);
      cable = {
        cableId,
        cableName,
        role: summary ? inferLegRole(summary) : "drop",
        fibersPerTube: count,
        fibersPerTubeConfidence: confidence,
        sourceRows: [],
      };
      cables.set(cableId, cable);
      if (confidence === "low" || confidence === "unknown") {
        warnings.push({
          ruleId: "SDC-DATA-002",
          severity: "warning",
          message: `Buffer tube count for "${cableName}" inferred as ${count} with ${confidence} confidence.`,
          objectIds: [cableId],
          suggestedFix: "Confirm the cable fiber count or buffer tube grouping.",
        });
      }
    }
    if (!cable.sourceRows.includes(row)) cable.sourceRows.push(row);
    return cable;
  }

  function ensureTube(
    cable: CableRecord,
    tubeColor: string,
    row: number,
  ): BufferTubeRecord {
    const tubeId = `${cable.cableId}::${tubeColor}`;
    let tube = tubes.get(tubeId);
    if (!tube) {
      tube = {
        tubeId,
        cableId: cable.cableId,
        tubeColor,
        fibersPerTube: cable.fibersPerTube,
        sourceRows: [],
      };
      tubes.set(tubeId, tube);
    }
    if (!tube.sourceRows.includes(row)) tube.sourceRows.push(row);
    return tube;
  }

  function ensureFiber(
    cable: CableRecord,
    tube: BufferTubeRecord,
    endpoint: CsvEndpoint,
    row: number,
  ): FiberStrandRecord {
    const fiberId = `${tube.tubeId}::${endpoint.fiberNumber}::${endpoint.fiberColor}`;
    let fiber = fibers.get(fiberId);
    if (!fiber) {
      fiber = {
        fiberId,
        cableId: cable.cableId,
        tubeId: tube.tubeId,
        tubeColor: tube.tubeColor,
        absoluteFiberNumber: endpoint.fiberNumber,
        fiberColor: endpoint.fiberColor,
        osCircuitName: endpoint.osTag,
        sourceRows: [],
      };
      fibers.set(fiberId, fiber);
    } else if (!fiber.osCircuitName && endpoint.osTag) {
      fiber.osCircuitName = endpoint.osTag;
    }
    if (!fiber.sourceRows.includes(row)) fiber.sourceRows.push(row);
    return fiber;
  }

  function toEndpoint(fiber: FiberStrandRecord, osTag?: string): ConnectionEndpoint {
    return {
      fiberId: fiber.fiberId,
      cableId: fiber.cableId,
      tubeId: fiber.tubeId,
      tubeColor: fiber.tubeColor,
      absoluteFiberNumber: fiber.absoluteFiberNumber,
      fiberColor: fiber.fiberColor,
      osCircuitName: osTag ?? fiber.osCircuitName,
    };
  }

  const seenDotIds = new Set<string>();

  for (const pair of parsed.pairs) {
    const row = pair.lineNumber;
    const aLegId = endpointLegId(pair.endpointA, "from");
    const bLegId = endpointLegId(pair.endpointB, "to");

    const cableA = ensureCable(aLegId, pair.endpointA.cableName, row);
    const cableB = ensureCable(bLegId, pair.endpointB.cableName, row);
    const tubeA = ensureTube(cableA, pair.endpointA.tubeColor, row);
    const tubeB = ensureTube(cableB, pair.endpointB.tubeColor, row);
    const fiberA = ensureFiber(cableA, tubeA, pair.endpointA, row);
    const fiberB = ensureFiber(cableB, tubeB, pair.endpointB, row);

    const dotId = `splice:${cableA.cableId}:${tubeA.tubeColor}:${fiberA.absoluteFiberNumber}--${cableB.cableId}:${tubeB.tubeColor}:${fiberB.absoluteFiberNumber}`;

    if (fiberA.fiberId === fiberB.fiberId) {
      errors.push({
        ruleId: "SDC-CONNECT-001",
        severity: "error",
        message: `Connection ${pair.id} has identical endpoints (${fiberA.fiberId}).`,
        sourceRows: [row],
        objectIds: [pair.id],
        suggestedFix: "Check the CSV row for a self-referencing splice.",
      });
    }

    if (seenDotIds.has(dotId)) {
      warnings.push({
        ruleId: "SDC-CONNECT-001",
        severity: "warning",
        message: `Duplicate fusion splice dot ${dotId} from connection ${pair.id}.`,
        sourceRows: [row],
        objectIds: [dotId, pair.id],
        suggestedFix: "Verify the CSV does not list the same physical splice twice.",
      });
    }
    seenDotIds.add(dotId);

    const fusionSpliceDot: FusionSpliceDot = {
      id: dotId,
      connectionId: pair.id,
      endpointAFiberId: fiberA.fiberId,
      endpointBFiberId: fiberB.fiberId,
    };
    fusionSpliceDots.push(fusionSpliceDot);

    connectionPairs.push({
      connectionId: pair.id,
      endpointA: toEndpoint(fiberA, pair.endpointA.osTag),
      endpointB: toEndpoint(fiberB, pair.endpointB.osTag),
      fusionSpliceDot,
      sourceRows: [row],
    });
  }

  return {
    source: {
      fileName: parsed.fileName,
      spliceName: parsed.header.spliceName,
      pairCount: parsed.pairs.length,
      leftRawRowCount: parsed.leftRawRowCount,
      rightRawRowCount: parsed.rightRawRowCount,
      parseGap: parsed.parseGap,
      failureCount: parsed.failures.length,
    },
    cables: [...cables.values()],
    bufferTubes: [...tubes.values()],
    fiberStrands: [...fibers.values()],
    connectionPairs,
    fusionSpliceDots,
    warnings,
    errors,
  };
}
