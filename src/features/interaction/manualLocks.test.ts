import { describe, expect, it } from "vitest";

import { createManualLock } from "@/features/interaction/manualLocks";
import { applyLocksToLayout } from "@/features/interaction/applyLocksToLayout";
import type { ConnectionGraph } from "@/features/diagram/types";
import type { LayoutResult } from "@/features/layout/types";

const graph: ConnectionGraph = {
  spliceName: "Test",
  legs: [{ id: "leg-a", cableName: "A", role: "through", fibersPerTube: 12, side: "left" }],
  tubes: [{ id: "t1", legId: "leg-a", tubeColor: "blue", sortIndex: 0 }],
  fibers: [
    {
      id: "f1",
      legId: "leg-a",
      tubeId: "t1",
      fiberNumber: 1,
      fiberColor: "blue",
      tubeColor: "blue",
    },
  ],
  connections: [],
};

const baseLayout: LayoutResult = {
  layoutMode: "horizontal",
  zoneLayout: {
    mode: "horizontal",
    horizontal: { leftEndCol: 10, centerStartCol: 12, centerEndCol: 44, rightStartCol: 46 },
  },
  placements: [
    { nodeId: "cable-leg-a", col: 2, row: 10 },
    { nodeId: "fiber-f1", col: 10, row: 8 },
  ],
  splicePoints: [],
  groupLanes: new Map(),
  connectionRows: new Map(),
  fanoutExits: new Map([["f1", 10]]),
  connectionMidCols: new Map(),
};

describe("applyLocksToLayout", () => {
  it("preserves locked cable row and shifts leg fibers", () => {
    const lock = createManualLock("cable", "leg-a", { col: 2, row: 14, side: "left" });
    const next = applyLocksToLayout(baseLayout, graph, [lock]);
    const cable = next.placements.find((p) => p.nodeId === "cable-leg-a");
    const fiber = next.placements.find((p) => p.nodeId === "fiber-f1");
    expect(cable?.row).toBe(14);
    expect(fiber?.row).toBe(12);
  });
});

describe("createManualLock", () => {
  it("uses stable lock ids", () => {
    const lock = createManualLock("cable", "leg-a", { col: 2, row: 10, side: "left" });
    expect(lock.lockId).toBe("cable:leg-a");
  });
});
