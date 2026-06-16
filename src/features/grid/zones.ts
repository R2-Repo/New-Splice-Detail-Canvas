export type GridZoneId = "leftCable" | "centerSplice" | "rightCable";

/** Column ranges for horizontal (left / center / right) layout. */
export type HorizontalZoneLayout = {
  leftEndCol: number;
  centerStartCol: number;
  centerEndCol: number;
  rightStartCol: number;
};

export const DEFAULT_DEMO_ZONE_LAYOUT: HorizontalZoneLayout = {
  leftEndCol: 12,
  centerStartCol: 13,
  centerEndCol: 28,
  rightStartCol: 29,
};

export function zoneAtColumn(
  col: number,
  layout: HorizontalZoneLayout,
): GridZoneId {
  if (col <= layout.leftEndCol) return "leftCable";
  if (col >= layout.rightStartCol) return "rightCable";
  return "centerSplice";
}

export function isInCenterZone(col: number, layout: HorizontalZoneLayout): boolean {
  return col >= layout.centerStartCol && col <= layout.centerEndCol;
}

export function centerZoneColumnSpan(layout: HorizontalZoneLayout): number {
  return layout.centerEndCol - layout.centerStartCol + 1;
}
