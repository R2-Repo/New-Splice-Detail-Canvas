import { describe, expect, it } from "vitest";

import { createManualLock } from "@/features/interaction/manualLocks";
import type { DiagramSnapshot } from "../types";

import { sdcUx001 } from "./ruleModule";

const emptySnapshot = {
  layoutMode: "horizontal" as const,
  connectionGraph: {
    spliceName: "T",
    legs: [{ id: "leg-a", cableName: "A", role: "through" as const, fibersPerTube: 12 as const }],
    tubes: [],
    fibers: [],
    connections: [],
  },
  layout: {
    layoutMode: "horizontal" as const,
    zoneLayout: {
      mode: "horizontal" as const,
      horizontal: { leftEndCol: 10, centerStartCol: 12, centerEndCol: 44, rightStartCol: 46 },
    },
    placements: [{ nodeId: "cable-leg-a", col: 2, row: 10 }],
    splicePoints: [],
    groupLanes: new Map(),
    connectionRows: new Map(),
    fanoutExits: new Map(),
    connectionMidCols: new Map(),
  },
  routing: { laneBook: { booked: [], allSegments: [] } as never, routes: [] },
  reactFlow: {
    nodes: [],
    edges: [],
    zoneLayout: null,
    zoneMode: "horizontal" as const,
    laneBook: { booked: [], allSegments: [] } as never,
  },
  manualLocks: [
    createManualLock("cable", "leg-a", { col: 2, row: 12, side: "left" }),
  ],
} satisfies DiagramSnapshot;

describe("sdc-ux-001", () => {
  it("flags when a locked cable moved", () => {
    const violations = sdcUx001.check(emptySnapshot);
    expect(violations.some((v) => v.severity === "error")).toBe(true);
  });

  it("passes when locked cable matches layout", () => {
    const snapshot: DiagramSnapshot = {
      ...emptySnapshot,
      layout: {
        ...emptySnapshot.layout,
        placements: [{ nodeId: "cable-leg-a", col: 2, row: 12 }],
      },
    };
    expect(sdcUx001.check(snapshot)).toEqual([]);
  });
});
