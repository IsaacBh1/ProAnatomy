export const LABELS = {
  maxCount: 40,
  /** Parts smaller than this fraction of the body's longest side get no label (unless selected/isolated). */
  minSizeFraction: 0.015,
  lineHeight: 15,
  edgePadding: 14,
  elbowOffset: 34,
  tickLength: 22,
  textGap: 5,
  /** A label only switches side after its anchor crosses the centre by this many pixels. */
  sideHysteresis: 55,
  maxNameLength: 34,
} as const
