import { describe, expect, it } from "vitest";

import { GRID_PITCH } from "@/features/grid/constants";

import { SDC_DEFAULTS } from "./sdcDefaults";

describe("SDC_DEFAULTS (SDC-CONST-001)", () => {
  it("composes the grid pitch from the canonical grid constant", () => {
    expect(SDC_DEFAULTS.grid.pitchPx).toBe(GRID_PITCH);
  });

  it("keeps bend clearance larger than the grid pitch", () => {
    expect(SDC_DEFAULTS.spacing.minBendClearancePx).toBeGreaterThan(SDC_DEFAULTS.grid.pitchPx);
  });

  it("orders fanout spacing min <= default <= max", () => {
    const { fanoutStrandMinPx, fanoutStrandPx, fanoutStrandMaxPx } = SDC_DEFAULTS.spacing;
    expect(fanoutStrandMinPx).toBeLessThanOrEqual(fanoutStrandPx);
    expect(fanoutStrandPx).toBeLessThanOrEqual(fanoutStrandMaxPx);
  });

  it("keeps the fusion dot radius within 4-6px", () => {
    expect(SDC_DEFAULTS.dot.radiusPx).toBeGreaterThanOrEqual(4);
    expect(SDC_DEFAULTS.dot.radiusPx).toBeLessThanOrEqual(6);
  });

  it("orders bend limits preferred2 <= preferred4 <= hard", () => {
    const { preferredMaxTwoSided, preferredMaxFourSided, hardMax } = SDC_DEFAULTS.bends;
    expect(preferredMaxTwoSided).toBeLessThanOrEqual(preferredMaxFourSided);
    expect(preferredMaxFourSided).toBeLessThanOrEqual(hardMax);
  });

  it("draws selected strands thicker than normal strands", () => {
    expect(SDC_DEFAULTS.stroke.selectedFiberStrandPx).toBeGreaterThan(SDC_DEFAULTS.stroke.fiberStrandPx);
  });
});
