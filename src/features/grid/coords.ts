import { GRID_PITCH } from "./constants";

export type GridPoint = {
  col: number;
  row: number;
};

export function gridToPx(index: number): number {
  return index * GRID_PITCH;
}

export function pxToGrid(px: number): number {
  return Math.round(px / GRID_PITCH);
}

export function snapToGrid(px: number): number {
  return pxToGrid(px) * GRID_PITCH;
}

export function gridPoint(col: number, row: number): GridPoint {
  return { col, row };
}

export function gridPointToPixel(point: GridPoint): { x: number; y: number } {
  return { x: gridToPx(point.col), y: gridToPx(point.row) };
}

export function pixelToGridPoint(x: number, y: number): GridPoint {
  return { col: pxToGrid(x), row: pxToGrid(y) };
}
