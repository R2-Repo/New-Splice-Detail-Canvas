import { useStore } from "@xyflow/react";
import { useMemo } from "react";

import {
  GRID_PITCH,
  gridToPx,
  type HorizontalZoneLayout,
  type LaneBook,
} from "@/features/grid";
import type { QuadZoneLayout } from "@/features/grid/quadZones";

const GRID_DEBUG_KEY = "sdc-grid-debug";

export function readGridDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("gridDebug") === "1") return true;
  return window.localStorage.getItem(GRID_DEBUG_KEY) === "1";
}

export function toggleGridDebugStorage(): boolean {
  const next = !readGridDebugEnabled();
  window.localStorage.setItem(GRID_DEBUG_KEY, next ? "1" : "0");
  return next;
}

type GridDebugOverlayProps = {
  zoneLayout?: HorizontalZoneLayout;
  quadZoneLayout?: QuadZoneLayout;
  laneBook: LaneBook | null;
  enabled: boolean;
};

export function GridDebugOverlay({
  zoneLayout,
  quadZoneLayout,
  laneBook,
  enabled,
}: GridDebugOverlayProps) {
  const transform = useStore((s) => s.transform);

  const svgContent = useMemo(() => {
    if (!enabled) return null;
    if (!zoneLayout && !quadZoneLayout) return null;

    const [tx, ty, zoom] = transform;
    const leftX = gridToPx((zoneLayout?.leftEndCol ?? quadZoneLayout?.leftEndCol ?? 0) + 0.5);
    const centerStartX = gridToPx(zoneLayout?.centerStartCol ?? quadZoneLayout?.centerStartCol ?? 0);
    const centerEndX = gridToPx((zoneLayout?.centerEndCol ?? quadZoneLayout?.centerEndCol ?? 0) + 1);
    const rightStartX = gridToPx(zoneLayout?.rightStartCol ?? quadZoneLayout?.rightStartCol ?? 0);

    const viewHeight = 800;
    const viewWidth = 1200;

    const columnLabels = [];
    for (let col = 0; col <= 40; col += 4) {
      columnLabels.push(
        <text
          key={`col-${col}`}
          x={gridToPx(col)}
          y={12}
          className="grid-debug-overlay__label"
        >
          c{col}
        </text>,
      );
    }

    const laneLines =
      laneBook?.booked.map((seg, i) => {
        if (seg.orientation === "vertical") {
          const x = gridToPx(seg.track);
          const y1 = gridToPx(seg.spanStart);
          const y2 = gridToPx(seg.spanEnd);
          return (
            <line
              key={`lane-v-${i}`}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              className="grid-debug-overlay__lane grid-debug-overlay__lane--vertical"
            />
          );
        }

        const y = gridToPx(seg.track);
        const x1 = gridToPx(seg.spanStart);
        const x2 = gridToPx(seg.spanEnd);
        return (
          <line
            key={`lane-h-${i}`}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            className="grid-debug-overlay__lane grid-debug-overlay__lane--horizontal"
          />
        );
      }) ?? [];

    return (
      <svg
        className="grid-debug-overlay"
        width={viewWidth}
        height={viewHeight}
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {columnLabels}
        <line
          x1={leftX}
          y1={0}
          x2={leftX}
          y2={viewHeight}
          className="grid-debug-overlay__zone grid-debug-overlay__zone--left"
        />
        <line
          x1={centerStartX}
          y1={0}
          x2={centerStartX}
          y2={viewHeight}
          className="grid-debug-overlay__zone grid-debug-overlay__zone--center"
        />
        <line
          x1={centerEndX}
          y1={0}
          x2={centerEndX}
          y2={viewHeight}
          className="grid-debug-overlay__zone grid-debug-overlay__zone--center"
        />
        <line
          x1={rightStartX}
          y1={0}
          x2={rightStartX}
          y2={viewHeight}
          className="grid-debug-overlay__zone grid-debug-overlay__zone--right"
        />
        {laneLines}
        <text x={gridToPx(2)} y={28} className="grid-debug-overlay__zone-label">
          leftCable
        </text>
        <text
          x={gridToPx((zoneLayout?.centerStartCol ?? quadZoneLayout?.centerStartCol ?? 0) + 2)}
          y={28}
          className="grid-debug-overlay__zone-label"
        >
          centerSplice
        </text>
        <text x={gridToPx((zoneLayout?.rightStartCol ?? quadZoneLayout?.rightStartCol ?? 0) + 2)} y={28} className="grid-debug-overlay__zone-label">
          rightCable
        </text>
        {quadZoneLayout ? (
          <>
            <line
              x1={0}
              y1={gridToPx(quadZoneLayout.topEndRow + 0.5)}
              x2={viewWidth}
              y2={gridToPx(quadZoneLayout.topEndRow + 0.5)}
              className="grid-debug-overlay__zone grid-debug-overlay__zone--left"
            />
            <line
              x1={0}
              y1={gridToPx(quadZoneLayout.bottomStartRow)}
              x2={viewWidth}
              y2={gridToPx(quadZoneLayout.bottomStartRow)}
              className="grid-debug-overlay__zone grid-debug-overlay__zone--right"
            />
          </>
        ) : null}
        <text x={8} y={viewHeight - 8} className="grid-debug-overlay__hint">
          pitch {GRID_PITCH}px · center cols{" "}
          {zoneLayout?.centerStartCol ?? quadZoneLayout?.centerStartCol}–
          {zoneLayout?.centerEndCol ?? quadZoneLayout?.centerEndCol}
        </text>
      </svg>
    );
  }, [enabled, laneBook, quadZoneLayout, transform, zoneLayout]);

  if (!enabled || !svgContent) return null;

  return (
    <div className="grid-debug-overlay__host" aria-hidden>
      {svgContent}
    </div>
  );
}
