import type { NormalizedImport } from "@/features/import/normalize";

import { emptySnapshot } from "./buildSnapshot";
import type { DiagramSnapshot } from "./types";

/**
 * Minimal valid normalized import: one through-pair (A#from BL/1 to B#to BL/1)
 * with a single fusion splice dot. Passes all data-stage rules.
 */
export function validNormalizedImport(): NormalizedImport {
  const tubeA = "A#from::BL";
  const tubeB = "B#to::BL";
  const fiberAId = `${tubeA}::1::BL`;
  const fiberBId = `${tubeB}::1::BL`;
  const dotId = "splice:A#from:BL:1--B#to:BL:1";

  return {
    source: {
      fileName: "fixture.csv",
      spliceName: "FIXTURE",
      pairCount: 1,
      leftRawRowCount: 1,
      rightRawRowCount: 0,
      parseGap: 0,
      failureCount: 0,
    },
    cables: [
      { cableId: "A#from", cableName: "A", role: "drop", fibersPerTube: 12, fibersPerTubeConfidence: "high", sourceRows: [14] },
      { cableId: "B#to", cableName: "B", role: "drop", fibersPerTube: 12, fibersPerTubeConfidence: "high", sourceRows: [14] },
    ],
    bufferTubes: [
      { tubeId: tubeA, cableId: "A#from", tubeColor: "BL", fibersPerTube: 12, sourceRows: [14] },
      { tubeId: tubeB, cableId: "B#to", tubeColor: "BL", fibersPerTube: 12, sourceRows: [14] },
    ],
    fiberStrands: [
      { fiberId: fiberAId, cableId: "A#from", tubeId: tubeA, tubeColor: "BL", absoluteFiberNumber: 1, fiberColor: "BL", sourceRows: [14] },
      { fiberId: fiberBId, cableId: "B#to", tubeId: tubeB, tubeColor: "BL", absoluteFiberNumber: 1, fiberColor: "BL", sourceRows: [14] },
    ],
    connectionPairs: [
      {
        connectionId: "pair-1",
        endpointA: { fiberId: fiberAId, cableId: "A#from", tubeId: tubeA, tubeColor: "BL", absoluteFiberNumber: 1, fiberColor: "BL" },
        endpointB: { fiberId: fiberBId, cableId: "B#to", tubeId: tubeB, tubeColor: "BL", absoluteFiberNumber: 1, fiberColor: "BL" },
        fusionSpliceDot: { id: dotId, connectionId: "pair-1", endpointAFiberId: fiberAId, endpointBFiberId: fiberBId },
        sourceRows: [14],
      },
    ],
    fusionSpliceDots: [
      { id: dotId, connectionId: "pair-1", endpointAFiberId: fiberAId, endpointBFiberId: fiberBId },
    ],
    warnings: [],
    errors: [],
  };
}

/** Empty snapshot with a normalized import attached. */
export function snapshotWith(normalizedImport: NormalizedImport): DiagramSnapshot {
  return { ...emptySnapshot(), normalizedImport };
}
