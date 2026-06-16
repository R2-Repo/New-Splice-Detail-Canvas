import { gridToPx, type GridPoint } from "./coords";

/** Grid placement for one diagram node — produced by layout/import, consumed by canvas. */
export type GridNodePlacement = {
  nodeId: string;
  col: number;
  row: number;
};

export function placementToPixel(placement: GridNodePlacement): { x: number; y: number } {
  return { x: gridToPx(placement.col), y: gridToPx(placement.row) };
}

export function placementsToPixelMap(
  placements: GridNodePlacement[],
): Map<string, { x: number; y: number }> {
  return new Map(placements.map((p) => [p.nodeId, placementToPixel(p)]));
}

export function gridPointFromPlacement(placement: GridNodePlacement): GridPoint {
  return { col: placement.col, row: placement.row };
}

/**
 * Future CSV import pipeline: parse → graph → layout → placements.
 * Stub returns demo anchor positions until import parser is rebuilt.
 */
export function demoPlacementsFromImport(_csvText: string, _fileName: string): GridNodePlacement[] {
  return [
    { nodeId: "demo-source", col: 8, row: 14 },
    { nodeId: "demo-target", col: 32, row: 14 },
  ];
}
