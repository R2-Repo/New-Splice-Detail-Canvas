import { describe, expect, it } from "vitest";

import { demoPlacementsFromImport, placementToPixel } from "./placement";

describe("grid placement", () => {
  it("converts placements to pixel positions on the grid", () => {
    const px = placementToPixel({ nodeId: "a", col: 2, row: 3 });
    expect(px).toEqual({ x: 48, y: 72 });
  });

  it("returns demo placements from import stub", () => {
    const placements = demoPlacementsFromImport("csv", "test.csv");
    expect(placements).toHaveLength(2);
    expect(placements[0]?.nodeId).toBe("demo-source");
  });
});
