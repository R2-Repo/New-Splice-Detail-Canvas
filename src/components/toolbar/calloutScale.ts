export const CALLOUT_SCALE_DEFAULT = 1;
export const CALLOUT_SCALE_MIN = 0.5;
export const CALLOUT_SCALE_MAX = 3;
export const CALLOUT_AUTO_ZOOM_DEFAULT = true;

export function clampCalloutScale(value: number): number {
  return Math.min(CALLOUT_SCALE_MAX, Math.max(CALLOUT_SCALE_MIN, value));
}

export function calloutScalePercent(userScale: number): number {
  return Math.round(clampCalloutScale(userScale) * 100);
}
