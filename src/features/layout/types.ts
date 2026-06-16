import type { GridPoint } from "@/features/grid/coords";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { HorizontalZoneLayout } from "@/features/grid/zones";

import type { LayoutMode } from "@/features/diagram/types";

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

export type ZoneLayout =
  | { mode: "horizontal"; horizontal: HorizontalZoneLayout }
  | { mode: "quad"; quad: QuadZoneLayout };

export type GroupLaneAssignment = {
  groupId: string;
  track: number;
};

export type LayoutResult = {
  layoutMode: LayoutMode;
  zoneLayout: ZoneLayout;
  placements: GridNodePlacement[];
  splicePoints: Array<{ connectionId: string; point: GridPoint }>;
  groupLanes: Map<string, number>;
  connectionRows: Map<string, number>;
};

export type LayoutOptions = {
  layoutMode: LayoutMode;
  overrides?: {
    nodePositions?: Record<string, { x: number; y: number }>;
  };
};
