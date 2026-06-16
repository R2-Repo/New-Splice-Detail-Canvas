import { compareFibers } from "./tiaColors";
import type { ConnectionGraph, SpliceConnection } from "./types";

export type StrandGroupKind = "sourceTube" | "destTube" | "pathCohort" | "dominantPair";

export type StrandGroup = {
  id: string;
  kind: StrandGroupKind;
  connectionIds: string[];
  label: string;
};

export type StrandGroupLayoutInput = {
  groups: StrandGroup[];
  globalConnectionOrder: string[];
  dominantPairLegIds: [string, string] | null;
};

function tubeGroupKey(legId: string, tubeColor: string, side: "from" | "to"): string {
  return `${side}::${legId}::${tubeColor}`;
}

export function classifyStrandGroups(graph: ConnectionGraph): StrandGroupLayoutInput {
  const sourceMap = new Map<string, string[]>();
  const destMap = new Map<string, string[]>();
  const pairCounts = new Map<string, { count: number; legs: [string, string] }>();

  for (const conn of graph.connections) {
    const fromFiber = graph.fibers.find((f) => f.id === conn.fromFiberId);
    const toFiber = graph.fibers.find((f) => f.id === conn.toFiberId);
    if (!fromFiber || !toFiber) continue;

    const srcKey = tubeGroupKey(conn.fromLegId, fromFiber.tubeColor, "from");
    const dstKey = tubeGroupKey(conn.toLegId, toFiber.tubeColor, "to");

    sourceMap.set(srcKey, [...(sourceMap.get(srcKey) ?? []), conn.id]);
    destMap.set(dstKey, [...(destMap.get(dstKey) ?? []), conn.id]);

    const legPairKey = [conn.fromLegId, conn.toLegId].sort().join("::");
    const existing = pairCounts.get(legPairKey) ?? { count: 0, legs: [conn.fromLegId, conn.toLegId] as [string, string] };
    existing.count += 1;
    pairCounts.set(legPairKey, existing);
  }

  const groups: StrandGroup[] = [];
  let groupNum = 0;

  for (const [key, ids] of sourceMap) {
    groups.push({
      id: `grp-${groupNum++}`,
      kind: "sourceTube",
      connectionIds: ids,
      label: key,
    });
  }

  for (const [key, ids] of destMap) {
    groups.push({
      id: `grp-${groupNum++}`,
      kind: "destTube",
      connectionIds: ids,
      label: key,
    });
  }

  let dominantPairLegIds: [string, string] | null = null;
  let maxCount = 0;
  for (const { count, legs } of pairCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      dominantPairLegIds = legs;
    }
  }

  if (dominantPairLegIds && maxCount >= 2) {
    const dominantIds = graph.connections
      .filter((c) => c.fromLegId === dominantPairLegIds![0] && c.toLegId === dominantPairLegIds![1])
      .map((c) => c.id);
    groups.push({
      id: `grp-dominant`,
      kind: "dominantPair",
      connectionIds: dominantIds,
      label: `dominant ${dominantPairLegIds.join(" ↔ ")}`,
    });
  }

  const globalConnectionOrder = sortConnections(graph.connections, graph);

  return { groups, globalConnectionOrder, dominantPairLegIds };
}

function sortConnections(connections: SpliceConnection[], graph: ConnectionGraph): string[] {
  return [...connections]
    .sort((a, b) => {
      const fa = graph.fibers.find((f) => f.id === a.fromFiberId);
      const fb = graph.fibers.find((f) => f.id === b.fromFiberId);
      if (!fa || !fb) return a.lineNumber - b.lineNumber;
      const cmp = compareFibers(fa, fb);
      return cmp !== 0 ? cmp : a.lineNumber - b.lineNumber;
    })
    .map((c) => c.id);
}

export function connectionRowIndex(order: string[], connectionId: string): number {
  return order.indexOf(connectionId);
}
