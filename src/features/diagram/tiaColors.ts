/** TIA-598 fiber colors in standard order within a buffer tube. */
export const TIA_FIBER_COLORS = [
  "BL",
  "OR",
  "GR",
  "BR",
  "SL",
  "WH",
  "RD",
  "BK",
  "YL",
  "VI",
  "RO",
  "AQ",
] as const;

/** Solid buffer tubes first, then striped (XX-BK). */
export const TIA_TUBE_COLORS = [
  "BL",
  "OR",
  "GR",
  "BR",
  "SL",
  "WH",
  "RD",
  "BK",
  "YL",
  "VI",
  "RO",
  "AQ",
  "BL-BK",
  "OR-BK",
  "GR-BK",
  "BR-BK",
  "SL-BK",
  "WH-BK",
  "RD-BK",
  "BK-BK",
  "YL-BK",
  "VI-BK",
  "RO-BK",
  "AQ-BK",
] as const;

export function tubeSortIndex(tubeColor: string): number {
  const idx = TIA_TUBE_COLORS.indexOf(tubeColor as (typeof TIA_TUBE_COLORS)[number]);
  return idx >= 0 ? idx : TIA_TUBE_COLORS.length + tubeColor.charCodeAt(0);
}

export function fiberSortIndex(fiberColor: string): number {
  const idx = TIA_FIBER_COLORS.indexOf(fiberColor as (typeof TIA_FIBER_COLORS)[number]);
  return idx >= 0 ? idx : TIA_FIBER_COLORS.length + fiberColor.charCodeAt(0);
}

export function compareTubeColors(a: string, b: string): number {
  return tubeSortIndex(a) - tubeSortIndex(b);
}

export function compareFiberColors(a: string, b: string): number {
  return fiberSortIndex(a) - fiberSortIndex(b);
}

export function compareFibers(
  a: { tubeColor: string; fiberNumber: number; fiberColor: string },
  b: { tubeColor: string; fiberNumber: number; fiberColor: string },
): number {
  const tubeDiff = compareTubeColors(a.tubeColor, b.tubeColor);
  if (tubeDiff !== 0) return tubeDiff;
  const numDiff = a.fiberNumber - b.fiberNumber;
  if (numDiff !== 0) return numDiff;
  return compareFiberColors(a.fiberColor, b.fiberColor);
}
