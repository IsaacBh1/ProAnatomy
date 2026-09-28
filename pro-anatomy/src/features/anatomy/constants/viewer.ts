export const SKIN_OPACITY = 0.08
export const DRAG_THRESHOLD_PX = 5
export const BAND_MIN_SIZE_PX = 6
export const CAMERA_FIT_PADDING = 1.2
export const FOCUS_PADDING = 1.35
export const CAMERA_ANIMATION_MS = 480
export const MAX_HISTORY = 40

/** Above this explode percentage the skin is hidden so the organs underneath stay visible. */
export const EXPLODE_HIDES_SKIN_ABOVE = 2
export const EXPLODE_DEFAULT_ON = 50

export const HIGHLIGHT = {
  selected: { color: 0xffffff, intensity: 0.18 },
  hovered: { color: 0x555555, intensity: 0.55 },
  idle: { color: 0x000000, intensity: 0 },
} as const
