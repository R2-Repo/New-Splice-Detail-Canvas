import type { ParsedCsv, SplicePairRow } from "./types";

export type CableLegSummary = {
  legId: string;
  cableName: string;
  fromCount: number;
  toCount: number;
  tubeColors: string[];
  fiberRange: { min: number; max: number };
};

export function summarizeCableLegs(pairs: SplicePairRow[]): CableLegSummary[] {
  const map = new Map<string, CableLegSummary>();

  for (const pair of pairs) {
    updateLeg(map, pair.endpointA.cableName, pair.endpointA.legId ?? pair.endpointA.cableName, "from", pair.endpointA);
    updateLeg(map, pair.endpointB.cableName, pair.endpointB.legId ?? pair.endpointB.cableName, "to", pair.endpointB);
  }

  return [...map.values()].sort((a, b) => a.cableName.localeCompare(b.cableName));
}

function updateLeg(
  map: Map<string, CableLegSummary>,
  cableName: string,
  legId: string,
  side: "from" | "to",
  endpoint: SplicePairRow["endpointA"],
): void {
  const existing = map.get(legId) ?? {
    legId,
    cableName,
    fromCount: 0,
    toCount: 0,
    tubeColors: [],
    fiberRange: { min: endpoint.fiberNumber, max: endpoint.fiberNumber },
  };

  if (side === "from") existing.fromCount += 1;
  else existing.toCount += 1;

  if (!existing.tubeColors.includes(endpoint.tubeColor)) {
    existing.tubeColors.push(endpoint.tubeColor);
  }

  existing.fiberRange = {
    min: Math.min(existing.fiberRange.min, endpoint.fiberNumber),
    max: Math.max(existing.fiberRange.max, endpoint.fiberNumber),
  };

  map.set(legId, existing);
}

export function inferLegRole(leg: CableLegSummary): "through" | "drop" {
  if (leg.fromCount > 0 && leg.toCount > 0) return "through";
  return "drop";
}

export function inferFibersPerTube(leg: CableLegSummary): 6 | 12 {
  const maxFibersInTube = leg.fiberRange.max;
  const tubeCount = leg.tubeColors.length;
  if (tubeCount === 0) return 12;
  const avg = maxFibersInTube / tubeCount;
  return avg <= 6.5 ? 6 : 12;
}

export function cableLegIdentityFromParsed(parsed: ParsedCsv): CableLegSummary[] {
  return summarizeCableLegs(parsed.pairs);
}
