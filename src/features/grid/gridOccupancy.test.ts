import { describe, expect, it } from "vitest";

import { buildLayoutOccupancy } from "./gridOccupancy";
import type { LayoutResult } from "@/features/layout/types";

function minimalHorizontalLayout(): LayoutResult {
  return {
    layoutMode: "horizontal",
    zoneLayout: {
      mode: "horizontal",
      horizontal: {
        leftEndCol: 10,
        centerStartCol: 12,
        centerEndCol: 44,
        rightStartCol: 46,
      },
    },
    placements: [
      { nodeId: "cable-leg-a", col: 2, row: 8 },
      { nodeId: "fiber-f1", col: 10, row: 8 },
    ],
    splicePoints: [],
    groupLanes: new Map(),
    connectionRows: new Map(),
    fanoutExits: new Map([["f1", 10]]),
    connectionMidCols: new Map(),
  };
}

describe("buildLayoutOccupancy", () => {
  it("blocks cable columns from routing", () => {
    const book = buildLayoutOccupancy(minimalHorizontalLayout());
    const blocked = book.segmentsWithStatus("blocked");
    expect(blocked.some((s) => s.track === 2 && s.owner === "cableZone")).toBe(true);
  });

  it("does not block fanout exit columns", () => {
    const book = buildLayoutOccupancy(minimalHorizontalLayout());
    const blockedAtExit = book.segmentsWithStatus("blocked").filter((s) => s.track === 10);
    expect(blockedAtExit.length).toBe(0);
  });

  it("allows route booking on unobstructed center lanes", () => {
    const book = buildLayoutOccupancy(minimalHorizontalLayout());
    expect(
      book.tryBook({ orientation: "vertical", track: 20, spanStart: 6, spanEnd: 12 }, "conn-1"),
    ).toBe(true);
  });
});
