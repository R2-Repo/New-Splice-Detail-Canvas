import type { ConnectionGraph, DiagramSide } from "@/features/diagram/types";
import {
  assignCableSides,
  stackOrderForSide,
} from "@/features/layout/assignCableSides";

import type { PlacementPlan } from "./types";

const HORIZONTAL_SIDES: DiagramSide[] = ["left", "right"];

function cloneSideAssignment(source: Map<string, DiagramSide>): Map<string, DiagramSide> {
  return new Map(source);
}

function mirrorHorizontalSides(
  assignment: Map<string, DiagramSide>,
): Map<string, DiagramSide> {
  const mirrored = new Map<string, DiagramSide>();
  for (const [legId, side] of assignment) {
    mirrored.set(legId, side === "left" ? "right" : side === "right" ? "left" : side);
  }
  return mirrored;
}

function buildStackOrder(
  graph: ConnectionGraph,
  sideAssignment: Map<string, DiagramSide>,
): Map<DiagramSide, string[]> {
  const stackOrder = new Map<DiagramSide, string[]>();
  for (const side of HORIZONTAL_SIDES) {
    stackOrder.set(side, stackOrderForSide(graph, side, sideAssignment));
  }
  return stackOrder;
}

function swapStackLegs(
  stack: string[],
  legA: string,
  legB: string,
): string[] {
  const copy = [...stack];
  const iA = copy.indexOf(legA);
  const iB = copy.indexOf(legB);
  if (iA < 0 || iB < 0) return copy;
  [copy[iA], copy[iB]] = [copy[iB]!, copy[iA]!];
  return copy;
}

function planFromAssignment(
  id: string,
  graph: ConnectionGraph,
  sideAssignment: Map<string, DiagramSide>,
  stackOverride?: Map<DiagramSide, string[]>,
): PlacementPlan {
  return {
    id,
    sideAssignment: cloneSideAssignment(sideAssignment),
    stackOrder: stackOverride ?? buildStackOrder(graph, sideAssignment),
  };
}

/** Default heuristic: #from → left, #to → right, volume stack order. */
export function generateDefaultCandidates(
  graph: ConnectionGraph,
  layoutMode: "horizontal" | "quad",
): PlacementPlan[] {
  const base = assignCableSides(graph, layoutMode);
  const candidates: PlacementPlan[] = [
    planFromAssignment("default", graph, base),
  ];

  if (layoutMode === "horizontal") {
    const mirrored = mirrorHorizontalSides(base);
    candidates.push(planFromAssignment("mirror-sides", graph, mirrored));

    for (const side of HORIZONTAL_SIDES) {
      const stack = stackOrderForSide(graph, side, base);
      if (stack.length >= 2) {
        const swapped = buildStackOrder(graph, base);
        swapped.set(side, swapStackLegs(stack, stack[0]!, stack[1]!));
        candidates.push(
          planFromAssignment(`swap-${side}-stack`, graph, base, swapped),
        );
      }
    }
  }

  return candidates;
}

const SP3254_SPLICE = "SP-3254.5";
const SEG_A_FROM = "144-SMF I-15 DIST: MP 258.96 - 4800 S#from";
const SEG_B_FROM = "144-SMF I-15 DIST: 4800 S - MP 259.46#from";
const DROP_FROM = "6 DROP (TSC): I-15 NB & 1600 S#from";

/** SP-3254.5-specific candidates — refine when user supplies placement rules. */
export function generateSp3254Candidates(graph: ConnectionGraph): PlacementPlan[] {
  if (graph.spliceName !== SP3254_SPLICE) {
    return generateDefaultCandidates(graph, "horizontal");
  }

  const base = assignCableSides(graph, "horizontal");
  const candidates = generateDefaultCandidates(graph, "horizontal");

  const defaultStack = buildStackOrder(graph, base);
  const leftStack = [...(defaultStack.get("left") ?? [])];

  if (leftStack.includes(SEG_A_FROM) && leftStack.includes(SEG_B_FROM)) {
    const swapped144 = new Map(defaultStack);
    swapped144.set(
      "left",
      swapStackLegs(leftStack, SEG_A_FROM, SEG_B_FROM),
    );
    candidates.push(planFromAssignment("swap-144-left", graph, base, swapped144));
  }

  const dropRight = cloneSideAssignment(base);
  dropRight.set(DROP_FROM, "right");
  const dropRightStack = buildStackOrder(graph, dropRight);
  candidates.push(planFromAssignment("drop-from-right", graph, dropRight, dropRightStack));

  return candidates;
}

export function generatePlacementCandidates(
  graph: ConnectionGraph,
  layoutMode: "horizontal" | "quad",
): PlacementPlan[] {
  if (layoutMode === "horizontal" && graph.spliceName === SP3254_SPLICE) {
    return generateSp3254Candidates(graph);
  }
  return generateDefaultCandidates(graph, layoutMode);
}
