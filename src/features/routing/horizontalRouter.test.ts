import { describe, expect, it } from "vitest";

import { LaneBook } from "@/features/grid/laneBook";
import type { HorizontalZoneLayout } from "@/features/grid/zones";

import { routeHorizontalConnection } from "./horizontalRouter";

const ZONE: HorizontalZoneLayout = {
  leftEndCol: 10,
  centerStartCol: 12,
  centerEndCol: 44,
  rightStartCol: 46,
};

describe("routeHorizontalConnection", () => {
  it("books lane segments and returns grid points for a simple leg", () => {
    const laneBook = new LaneBook();
    const result = routeHorizontalConnection(
      { col: 10, row: 8 },
      { col: 28, row: 8 },
      { col: 46, row: 12 },
      ZONE,
      laneBook,
      14,
      "pair-test",
    );

    expect(result.routeError).toBeUndefined();
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.gridPoints.length).toBeGreaterThan(3);
    expect(result.laneSegments.length).toBeGreaterThan(0);
    expect(laneBook.booked.length).toBeGreaterThan(0);
  });

  it("reuses shared horizontal bus on the same splice row", () => {
    const laneBook = new LaneBook();
    const first = routeHorizontalConnection(
      { col: 10, row: 8 },
      { col: 28, row: 8 },
      { col: 46, row: 10 },
      ZONE,
      laneBook,
      14,
      "pair-a",
    );
    const second = routeHorizontalConnection(
      { col: 10, row: 8 },
      { col: 28, row: 8 },
      { col: 46, row: 11 },
      ZONE,
      laneBook,
      15,
      "pair-b",
    );

    expect(first.routeError).toBeUndefined();
    expect(second.routeError).toBeUndefined();
  });
});
