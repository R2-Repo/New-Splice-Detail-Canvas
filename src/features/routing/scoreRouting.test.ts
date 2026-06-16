import { describe, expect, it } from "vitest";

import {
  countOrthogonalBends,
  countSegmentCrossings,
  parseSvgPath,
  scoreRoutingFromParts,
} from "./scoreRouting";
import { LaneBook } from "@/features/grid/laneBook";

describe("scoreRouting", () => {
  it("counts orthogonal bends in an L-shaped path", () => {
    const segments = parseSvgPath("M 0 0 L 100 0 L 100 50");
    expect(countOrthogonalBends(segments)).toBe(1);
  });

  it("counts zero bends for a straight path", () => {
    const segments = parseSvgPath("M 0 0 L 200 0");
    expect(countOrthogonalBends(segments)).toBe(0);
  });

  it("detects crossing horizontal and vertical segments", () => {
    const a = parseSvgPath("M 0 50 L 100 50");
    const b = parseSvgPath("M 50 0 L 50 100");
    expect(countSegmentCrossings([a, b])).toBe(1);
  });

  it("ignores crossings at shared endpoints", () => {
    const a = parseSvgPath("M 0 0 L 100 0");
    const b = parseSvgPath("M 100 0 L 100 50");
    expect(countSegmentCrossings([a, b])).toBe(0);
  });
});

describe("scoreRoutingFromParts integration", () => {
  it("returns finite score for empty routing", () => {
    const breakdown = scoreRoutingFromParts(
      { spliceName: "", legs: [], tubes: [], fibers: [], connections: [] },
      {
        layoutMode: "horizontal",
        zoneLayout: {
          mode: "horizontal",
          horizontal: { leftEndCol: 4, centerStartCol: 8, centerEndCol: 12, rightStartCol: 16 },
        },
        placements: [],
        splicePoints: [],
        groupLanes: new Map(),
        connectionRows: new Map(),
      },
      { laneBook: new LaneBook(), routes: [] },
    );
    expect(breakdown.score).toBe(0);
    expect(breakdown.routeErrors).toBe(0);
  });
});
