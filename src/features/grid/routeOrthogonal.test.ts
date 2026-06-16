import { describe, expect, it } from "vitest";

import { LaneBook } from "./laneBook";
import { routeHorizontalSpliceLeg } from "./routeOrthogonal";
import { DEFAULT_DEMO_ZONE_LAYOUT } from "./zones";

describe("routeHorizontalSpliceLeg", () => {
  it("routes through a booked midX lane in the center zone", () => {
    const book = new LaneBook();
    const result = routeHorizontalSpliceLeg(
      { col: 8, row: 14 },
      { col: 32, row: 14 },
      DEFAULT_DEMO_ZONE_LAYOUT,
      book,
    );

    expect("path" in result).toBe(true);
    if (!("path" in result)) return;

    expect(result.midXCol).toBeGreaterThanOrEqual(DEFAULT_DEMO_ZONE_LAYOUT.centerStartCol);
    expect(result.midXCol).toBeLessThanOrEqual(DEFAULT_DEMO_ZONE_LAYOUT.centerEndCol);
    expect(result.path).toMatch(/^M /);
    expect(book.booked.length).toBe(3);
  });

  it("returns laneConflict when center lanes are exhausted", () => {
    const book = new LaneBook();
    const layout = {
      leftEndCol: 4,
      centerStartCol: 5,
      centerEndCol: 5,
      rightStartCol: 6,
    };

    book.tryBook({ orientation: "vertical", track: 5, spanStart: 10, spanEnd: 20 });

    const result = routeHorizontalSpliceLeg(
      { col: 2, row: 14 },
      { col: 8, row: 14 },
      layout,
      book,
    );

    expect(result).toMatchObject({ code: "noMidXLane" });
  });
});
