import { gridToPx, type GridPoint } from "./coords";
import { LaneBook } from "./laneBook";
import { type HorizontalZoneLayout, isInCenterZone } from "./zones";

export type OrthogonalRouteResult = {
  path: string;
  midXCol: number;
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
};

export type RouteError = {
  code: "lateHorizontalBend" | "noMidXLane" | "laneConflict";
  message: string;
};

/**
 * Route a horizontal-layout splice leg: source handle → midX vertical lane → target handle.
 * Books lanes before returning the SVG path.
 */
export function routeHorizontalSpliceLeg(
  source: GridPoint,
  target: GridPoint,
  zoneLayout: HorizontalZoneLayout,
  laneBook: LaneBook,
): OrthogonalRouteResult | RouteError {
  const rowStart = Math.min(source.row, target.row);
  const rowEnd = Math.max(source.row, target.row);

  const midXCol = allocateMidXLane(laneBook, rowStart, rowEnd, zoneLayout);
  if (midXCol === null) {
    return {
      code: "noMidXLane",
      message: `No free midX lane in center zone cols ${zoneLayout.centerStartCol}–${zoneLayout.centerEndCol}`,
    };
  }

  const sourceHorizEnd = midXCol;
  if (
    source.col < zoneLayout.centerStartCol &&
    sourceHorizEnd > zoneLayout.leftEndCol + 1
  ) {
    // Horizontal leg stayed in left zone too long before turning — late bend detectable.
  }

  const horizSourceOk = laneBook.tryBook({
    orientation: "horizontal",
    track: source.row,
    spanStart: Math.min(source.col, sourceHorizEnd),
    spanEnd: Math.max(source.col, sourceHorizEnd),
  });
  const vertOk = laneBook.tryBook({
    orientation: "vertical",
    track: midXCol,
    spanStart: rowStart,
    spanEnd: rowEnd,
  });
  const horizTargetOk = laneBook.tryBook({
    orientation: "horizontal",
    track: target.row,
    spanStart: Math.min(midXCol, target.col),
    spanEnd: Math.max(midXCol, target.col),
  });

  if (!horizSourceOk || !vertOk || !horizTargetOk) {
    return {
      code: "laneConflict",
      message: `Could not book orthogonal path through midX col ${midXCol}`,
    };
  }

  const sx = gridToPx(source.col);
  const sy = gridToPx(source.row);
  const mx = gridToPx(midXCol);
  const ty = gridToPx(target.row);
  const tx = gridToPx(target.col);

  const segments = [
    { x1: sx, y1: sy, x2: mx, y2: sy },
    { x1: mx, y1: sy, x2: mx, y2: ty },
    { x1: mx, y1: ty, x2: tx, y2: ty },
  ];

  const path = segments
    .map((s, i) => (i === 0 ? `M ${s.x1} ${s.y1}` : "") + ` L ${s.x2} ${s.y2}`)
    .join("");

  return { path, midXCol, segments };
}

function allocateMidXLane(
  laneBook: LaneBook,
  rowStart: number,
  rowEnd: number,
  zoneLayout: HorizontalZoneLayout,
): number | null {
  for (let col = zoneLayout.centerStartCol; col <= zoneLayout.centerEndCol; col += 1) {
    if (!isInCenterZone(col, zoneLayout)) continue;

    const conflict = laneBook.isBooked({
      orientation: "vertical",
      track: col,
      spanStart: rowStart,
      spanEnd: rowEnd,
    });
    if (!conflict) return col;
  }

  return null;
}

export function detectLateVerticalBend(
  source: GridPoint,
  midXCol: number,
  zoneLayout: HorizontalZoneLayout,
): RouteError | null {
  if (source.col >= zoneLayout.centerStartCol) return null;

  const maxLeftHorizCol = zoneLayout.leftEndCol;
  const horizSpan = midXCol - source.col;
  const centerEntryCol = zoneLayout.centerStartCol;

  if (source.col <= maxLeftHorizCol && midXCol > centerEntryCol + 2) {
    return {
      code: "lateHorizontalBend",
      message:
        `Source at col ${source.col} bent vertical at col ${midXCol} ` +
        `(center starts col ${centerEntryCol}). Horizontal span ${horizSpan} cols.`,
    };
  }

  return null;
}
