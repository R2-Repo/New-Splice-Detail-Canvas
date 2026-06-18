/**
 * TIA fiber/tube color abbreviation -> render hex (SDC-VISUAL-001).
 * Configurable defaults; the canonical color order/abbreviations live in
 * `tiaColors.ts` and SDC-ORDER-001/002.
 */
const FIBER_COLOR_HEX: Record<string, string> = {
  BL: "#0070C0",
  OR: "#F4A000",
  GR: "#00A651",
  BR: "#8B5A2B",
  SL: "#808080",
  WH: "#FFFFFF",
  RD: "#D71920",
  BK: "#111111",
  YL: "#FFD200",
  VI: "#8E44AD",
  RS: "#F06292",
  RO: "#F06292", // Rose alias used by tiaColors.ts
  AQ: "#00B7C3",
};

const FALLBACK_HEX = "#888888";

function baseAbbreviation(abbreviation: string): string {
  // Striped tubes look like "BL-BK" or "BL/S"; use the base color for fill.
  return abbreviation.split(/[-/]/)[0]?.trim().toUpperCase() ?? "";
}

/** Resolve a fiber/tube color abbreviation to a hex value. */
export function fiberColorToHex(abbreviation: string | undefined): string {
  if (!abbreviation) return FALLBACK_HEX;
  const key = abbreviation.trim().toUpperCase();
  return FIBER_COLOR_HEX[key] ?? FIBER_COLOR_HEX[baseAbbreviation(key)] ?? FALLBACK_HEX;
}

/** True when the color is light enough to need an outline against the canvas. */
export function needsContrastOutline(abbreviation: string | undefined): boolean {
  const key = (abbreviation ?? "").trim().toUpperCase();
  return key === "WH" || key === "YL";
}

/** Whether a striped tube color (e.g. "BL-BK") should render a stripe overlay. */
export function isStripedColor(abbreviation: string | undefined): boolean {
  return Boolean(abbreviation && /[-/]/.test(abbreviation));
}
