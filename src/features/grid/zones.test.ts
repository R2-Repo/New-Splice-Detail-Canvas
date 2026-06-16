import { describe, expect, it } from "vitest";

import { DEFAULT_DEMO_ZONE_LAYOUT, isInCenterZone, zoneAtColumn } from "./zones";

describe("grid zones", () => {
  const layout = DEFAULT_DEMO_ZONE_LAYOUT;

  it("classifies columns into left, center, right", () => {
    expect(zoneAtColumn(5, layout)).toBe("leftCable");
    expect(zoneAtColumn(20, layout)).toBe("centerSplice");
    expect(zoneAtColumn(35, layout)).toBe("rightCable");
  });

  it("detects center zone bounds", () => {
    expect(isInCenterZone(13, layout)).toBe(true);
    expect(isInCenterZone(12, layout)).toBe(false);
    expect(isInCenterZone(29, layout)).toBe(false);
  });
});
