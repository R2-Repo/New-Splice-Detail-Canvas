import type { LayoutResult } from "@/features/layout/types";
import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

import { LaneBook, type LaneSegment } from "./laneBook";
import type { HorizontalZoneLayout } from "./zones";

const LABEL_BAND_COLS = 2;

/**
 * Pre-block reserved areas from layout geometry (SDC-ROUTE-001 / SDC-GRID-001).
 * Cable boxes and label bands are blocked; fanout exits and fusion dots remain
 * valid route anchors (routes start/end there, not pass through).
 */
export function buildLayoutOccupancy(layout: LayoutResult): LaneBook {
  const book = new LaneBook();

  if (layout.layoutMode === "horizontal" && layout.zoneLayout.mode === "horizontal") {
    blockHorizontalReservedAreas(book, layout, layout.zoneLayout.horizontal);
  }

  return book;
}

function blockHorizontalReservedAreas(
  book: LaneBook,
  layout: LayoutResult,
  zone: HorizontalZoneLayout,
): void {
  const rowMin = layout.placements.reduce((m, p) => Math.min(m, p.row), Number.POSITIVE_INFINITY);
  const rowMax = layout.placements.reduce((m, p) => Math.max(m, p.row), Number.NEGATIVE_INFINITY);
  const rowSpanStart = rowMin - 2;
  const rowSpanEnd = rowMax + 2;

  // Cable side zones — vertical bands at cable columns.
  const cableCols = new Set<number>();
  for (const p of layout.placements) {
    if (p.nodeId.startsWith("cable-")) cableCols.add(p.col);
  }
  for (const col of cableCols) {
    book.block(
      { orientation: "vertical", track: col, spanStart: rowSpanStart, spanEnd: rowSpanEnd },
      "cableZone",
    );
  }

  // Label bands outboard of each fiber (not the fanout exit column itself).
  for (const p of layout.placements) {
    if (!p.nodeId.startsWith("fiber-")) continue;
    const exitCol = layout.fanoutExits.get(p.nodeId.replace("fiber-", "")) ?? p.col;
    const labelDir = exitCol <= zone.centerStartCol ? -1 : 1;
    for (let c = 1; c <= LABEL_BAND_COLS; c += 1) {
      book.block(
        {
          orientation: "vertical",
          track: exitCol + labelDir * c,
          spanStart: p.row - 1,
          spanEnd: p.row + 1,
        },
        "labelBand",
      );
    }
  }

  // Side margins outside fanout areas.
  blockVerticalBand(book, zone.leftEndCol - LABEL_BAND_COLS, rowSpanStart, rowSpanEnd, "leftMargin");
  blockVerticalBand(book, zone.rightStartCol + LABEL_BAND_COLS, rowSpanStart, rowSpanEnd, "rightMargin");
}

function blockVerticalBand(
  book: LaneBook,
  col: number,
  rowStart: number,
  rowEnd: number,
  owner: string,
): void {
  if (col < 0) return;
  book.block({ orientation: "vertical", track: col, spanStart: rowStart, spanEnd: rowEnd }, owner);
}

/** Minimum bend clearance in grid columns (SDC-ROUTE-001). */
export function bendClearanceCols(): number {
  return Math.max(
    1,
    Math.round(SDC_DEFAULTS.spacing.minBendClearancePx / SDC_DEFAULTS.grid.pitchPx),
  );
}

/** Cable-group separation in grid columns. */
export function cableGroupSeparationCols(): number {
  return Math.max(
    1,
    Math.round(SDC_DEFAULTS.spacing.cableGroupSeparationPx / SDC_DEFAULTS.grid.pitchPx),
  );
}

export function segmentKey(segment: LaneSegment): string {
  return `${segment.orientation}:${segment.track}:${segment.spanStart}:${segment.spanEnd}`;
}
