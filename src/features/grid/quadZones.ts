import { DEFAULT_DEMO_ZONE_LAYOUT, type HorizontalZoneLayout } from "@/features/grid/zones";

export type QuadZoneLayout = {
  topEndRow: number;
  bottomStartRow: number;
  leftEndCol: number;
  rightStartCol: number;
  centerStartCol: number;
  centerEndCol: number;
  centerStartRow: number;
  centerEndRow: number;
};

export type QuadZoneId = "topCable" | "bottomCable" | "leftCable" | "rightCable" | "centerSplice";

export function defaultHorizontalZoneLayout(connectionCount: number): HorizontalZoneLayout {
  const centerSpan = Math.max(16, Math.min(48, connectionCount + 8));
  const leftEnd = 12;
  return {
    leftEndCol: leftEnd,
    centerStartCol: leftEnd + 1,
    centerEndCol: leftEnd + centerSpan,
    rightStartCol: leftEnd + centerSpan + 1,
  };
}

export function defaultQuadZoneLayout(connectionCount: number): QuadZoneLayout {
  const centerSpan = Math.max(12, Math.min(32, Math.ceil(Math.sqrt(connectionCount)) + 8));
  const margin = 10;
  return {
    topEndRow: margin,
    bottomStartRow: margin + centerSpan + 1,
    leftEndCol: margin,
    rightStartCol: margin + centerSpan + 1,
    centerStartCol: margin + 1,
    centerEndCol: margin + centerSpan,
    centerStartRow: margin + 1,
    centerEndRow: margin + centerSpan,
  };
}

export function zoneAtQuadColumnRow(
  col: number,
  row: number,
  layout: QuadZoneLayout,
): QuadZoneId {
  if (row <= layout.topEndRow) return "topCable";
  if (row >= layout.bottomStartRow) return "bottomCable";
  if (col <= layout.leftEndCol) return "leftCable";
  if (col >= layout.rightStartCol) return "rightCable";
  return "centerSplice";
}

export function isInQuadCenter(col: number, row: number, layout: QuadZoneLayout): boolean {
  return (
    col >= layout.centerStartCol &&
    col <= layout.centerEndCol &&
    row >= layout.centerStartRow &&
    row <= layout.centerEndRow
  );
}

/** Demo horizontal layout — kept for grid debug baseline. */
export { DEFAULT_DEMO_ZONE_LAYOUT };
