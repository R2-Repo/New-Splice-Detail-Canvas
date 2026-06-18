import { GRID_PITCH, TUBE_GROUP_GAP } from "@/features/grid/constants";

/**
 * Canonical numeric defaults for layout, routing, and rendering (SDC-CONST-001).
 * Single source of truth: features MUST read from here instead of hardcoding.
 * Grid pitch/gap are re-composed from the grid constants to avoid duplication.
 */
export const SDC_DEFAULTS = {
  grid: {
    pitchPx: GRID_PITCH,
    tubeGroupGapPx: TUBE_GROUP_GAP,
  },
  spacing: {
    minBendClearancePx: 60,
    fanoutStrandPx: GRID_PITCH,
    fanoutStrandMinPx: 16,
    fanoutStrandMaxPx: 48,
    cableGroupSeparationPx: GRID_PITCH * 2,
    strandBufferPx: 12,
  },
  dot: {
    radiusPx: 5,
  },
  stroke: {
    fiberStrandPx: 2,
    selectedFiberStrandPx: 4,
    bufferTubePx: 4,
    cableBodyPx: 2,
  },
  bends: {
    preferredMaxTwoSided: 4,
    preferredMaxFourSided: 6,
    hardMax: 10,
  },
  page: {
    paddingPx: 48,
  },
} as const;

export type SdcDefaults = typeof SDC_DEFAULTS;
