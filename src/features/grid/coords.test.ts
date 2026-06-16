import { describe, expect, it } from "vitest";

import { GRID_PITCH } from "./constants";
import { gridPoint, gridToPx, pxToGrid, snapToGrid } from "./coords";

describe("grid coords", () => {
  it("uses 24px pitch", () => {
    expect(GRID_PITCH).toBe(24);
    expect(gridToPx(3)).toBe(72);
    expect(pxToGrid(72)).toBe(3);
  });

  it("snaps pixels to nearest grid line", () => {
    expect(snapToGrid(50)).toBe(48);
    expect(snapToGrid(60)).toBe(72);
  });

  it("builds grid points", () => {
    expect(gridPoint(2, 5)).toEqual({ col: 2, row: 5 });
  });
});
