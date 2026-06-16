import {
  cableLegIdentityFromParsed,
  inferFibersPerTube,
  inferLegRole,
} from "@/features/import/cableLegIdentity";
import { enrichParsedCsv, parseBentleyCsv } from "@/features/import/parseBentleyCsv";
import type { ParsedCsv } from "@/features/import/types";

import { compareFibers, tubeSortIndex } from "./tiaColors";
import type {
  BufferTube,
  CableLeg,
  ConnectionGraph,
  FiberStrand,
  SpliceConnection,
} from "./types";

export function buildConnectionGraph(parsedInput: ParsedCsv | string, fileName?: string): ConnectionGraph {
  const parsed =
    typeof parsedInput === "string"
      ? enrichParsedCsv(parseBentleyCsv(parsedInput, fileName ?? "import.csv"))
      : enrichParsedCsv(parsedInput);

  const legSummaries = cableLegIdentityFromParsed(parsed);
  const legs: CableLeg[] = legSummaries.map((summary) => ({
    id: summary.legId,
    cableName: summary.cableName,
    role: inferLegRole(summary),
    fibersPerTube: inferFibersPerTube(summary),
  }));

  const tubes: BufferTube[] = [];
  const fibers: FiberStrand[] = [];
  const fiberIndex = new Map<string, FiberStrand>();

  function ensureFiber(
    legId: string,
    tubeColor: string,
    fiberNumber: number,
    fiberColor: string,
  ): FiberStrand {
    const tubeId = `${legId}::${tubeColor}`;
    if (!tubes.some((t) => t.id === tubeId)) {
      tubes.push({
        id: tubeId,
        legId,
        tubeColor,
        sortIndex: tubeSortIndex(tubeColor),
      });
    }

    const fiberId = `${tubeId}::${fiberNumber}::${fiberColor}`;
    const existing = fiberIndex.get(fiberId);
    if (existing) return existing;

    const fiber: FiberStrand = {
      id: fiberId,
      legId,
      tubeId,
      fiberNumber,
      fiberColor,
      tubeColor,
    };
    fiberIndex.set(fiberId, fiber);
    fibers.push(fiber);
    return fiber;
  }

  const connections: SpliceConnection[] = parsed.pairs.map((pair) => {
    const fromLegId = pair.endpointA.legId ?? `${pair.endpointA.cableName}#from`;
    const toLegId = pair.endpointB.legId ?? `${pair.endpointB.cableName}#to`;

    const fromFiber = ensureFiber(
      fromLegId,
      pair.endpointA.tubeColor,
      pair.endpointA.fiberNumber,
      pair.endpointA.fiberColor,
    );
    const toFiber = ensureFiber(
      toLegId,
      pair.endpointB.tubeColor,
      pair.endpointB.fiberNumber,
      pair.endpointB.fiberColor,
    );

    return {
      id: pair.id,
      lineNumber: pair.lineNumber,
      fromFiberId: fromFiber.id,
      toFiberId: toFiber.id,
      fromLegId,
      toLegId,
      osTag: pair.endpointB.osTag,
    };
  });

  tubes.sort((a, b) => a.sortIndex - b.sortIndex || a.id.localeCompare(b.id));
  fibers.sort((a, b) => compareFibers(a, b) || a.id.localeCompare(b.id));

  return {
    spliceName: parsed.header.spliceName,
    legs,
    tubes,
    fibers,
    connections,
  };
}
