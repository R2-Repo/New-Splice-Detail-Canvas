import type { GridPoint } from "@/features/grid/coords";
import type { GridNodePlacement } from "@/features/grid/placement";
import type { HorizontalZoneLayout } from "@/features/grid/zones";

import type { LayoutMode } from "@/features/diagram/types";
import type { StrandGroupLayoutInput } from "@/features/diagram/strandGroups";
import type { PlacementPlan } from "@/features/rules/placement/types";

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
  /** Buffer-tube group id -> preferred vertical mid column in center routing grid. */
  groupLanes: Map<string, number>;
  connectionRows: Map<string, number>;
  /** Fiber id -> fanout exit column (routing start point). */
  fanoutExits: Map<string, number>;
  /** Connection id -> preferred vertical mid column in center routing grid. */
  connectionMidCols: Map<string, number>;
};

export type LayoutOptions = {
  layoutMode: LayoutMode;
  placementPlan?: PlacementPlan;
  strandInput?: StrandGroupLayoutInput;
  overrides?: {
    nodePositions?: Record<string, { x: number; y: number }>;
  };
};
