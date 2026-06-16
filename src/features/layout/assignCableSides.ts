import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";

export type SideAssignment = Map<string, DiagramSide>;

const HORIZONTAL_SIDES: DiagramSide[] = ["left", "right"];
const QUAD_SIDES: DiagramSide[] = ["left", "right", "top", "bottom"];

export function assignCableSides(
  graph: ConnectionGraph,
  layoutMode: "horizontal" | "quad",
): SideAssignment {
  const sides = layoutMode === "horizontal" ? HORIZONTAL_SIDES : QUAD_SIDES;
  const assignment = new Map<string, DiagramSide>();

  const legStats = new Map<string, { from: number; to: number }>();
  for (const leg of graph.legs) {
    legStats.set(leg.id, { from: 0, to: 0 });
  }

  for (const conn of graph.connections) {
    const fromStats = legStats.get(conn.fromLegId);
    const toStats = legStats.get(conn.toLegId);
    if (fromStats) fromStats.from += 1;
    if (toStats) toStats.to += 1;
  }

  const leftCandidates: string[] = [];
  const rightCandidates: string[] = [];
  const flexible: string[] = [];

  for (const leg of graph.legs) {
    const stats = legStats.get(leg.id) ?? { from: 0, to: 0 };
    if (stats.from > 0 && stats.to === 0) leftCandidates.push(leg.id);
    else if (stats.to > 0 && stats.from === 0) rightCandidates.push(leg.id);
    else flexible.push(leg.id);
  }

  if (layoutMode === "horizontal") {
    assignStack(leftCandidates, "left", assignment);
    assignStack(rightCandidates, "right", assignment);
    flexible.forEach((legId, i) => {
      assignment.set(legId, i % 2 === 0 ? "left" : "right");
    });
    return assignment;
  }

  // Quad: distribute across four sides by connection volume
  const ranked = [...graph.legs].sort((a, b) => {
    const aCount = graph.connections.filter((c) => c.fromLegId === a.id || c.toLegId === a.id).length;
    const bCount = graph.connections.filter((c) => c.fromLegId === b.id || c.toLegId === b.id).length;
    return bCount - aCount;
  });

  ranked.forEach((leg, i) => {
    assignment.set(leg.id, sides[i % sides.length] ?? "left");
  });

  return assignment;
}

function assignStack(legIds: string[], side: DiagramSide, assignment: SideAssignment): void {
  legIds.forEach((legId, index) => {
    assignment.set(legId, side);
    void index;
  });
}

export function stackOrderForSide(
  graph: ConnectionGraph,
  side: DiagramSide,
  sideAssignment: SideAssignment,
): string[] {
  return graph.legs
    .filter((leg) => sideAssignment.get(leg.id) === side)
    .sort((a, b) => {
      const aConns = graph.connections.filter((c) => c.fromLegId === a.id || c.toLegId === a.id).length;
      const bConns = graph.connections.filter((c) => c.fromLegId === b.id || c.toLegId === b.id).length;
      return bConns - aConns || a.cableName.localeCompare(b.cableName);
    })
    .map((leg) => leg.id);
}
