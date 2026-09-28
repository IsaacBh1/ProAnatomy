// src/features/drawing/constants.ts
import type { ElementStyle, ToolId } from './types'

export const PALETTE = [
  '#e03030',
  '#e0c34c',
  '#72a647',
  '#4f7db5',
  '#d964b1',
  '#8b5dbf',
  '#d0d0d0',
  '#1a1d21',
] as const

export const FILL_OPTIONS = [
  { label: 'None', value: null },
  { label: 'Soft', value: 'soft' },
  { label: 'Solid', value: 'solid' },
] as const

export const STROKE_WIDTHS = [1, 2, 3, 5, 8] as const

export const DEFAULT_STYLE: ElementStyle = {
  stroke: PALETTE[0],
  fill: null,
  strokeWidth: 2,
  dash: 'solid',
  opacity: 1,
}

export const DEFAULT_FONT_SIZE = 16
export const HIT_TOLERANCE = 6
export const HANDLE_SIZE = 8
export const HANDLE_HIT = 12

export interface ToolDef {
  id: ToolId
  label: string
  key: string
}

/** Same names, icons, and shortcuts as explore mode. */
export const CAMERA_TOOLS: readonly ToolDef[] = [
  { id: 'orbit', label: 'Orbit', key: 'O' },
  { id: 'zoom', label: 'Zoom', key: 'Z' },
  { id: 'pan', label: 'Hand', key: 'H' },
]

/** Just Select. Matches explore mode exactly. */
export const SELECTION_TOOLS: readonly ToolDef[] = [
  { id: 'select', label: 'Select', key: 'V' },
]

/** Edit. Manipulates elements already on the canvas. */
export const EDIT_TOOLS: readonly ToolDef[] = [
  { id: 'edit', label: 'Edit', key: 'X' },
]

export const DRAWING_TOOLS: readonly ToolDef[] = [
  { id: 'brush', label: 'Brush', key: 'B' },
  { id: 'eraser', label: 'Eraser', key: 'E' },
  { id: 'line', label: 'Line', key: 'L' },
  { id: 'arrow', label: 'Arrow', key: 'A' },
  { id: 'rect', label: 'Rectangle', key: 'R' },
  { id: 'ellipse', label: 'Ellipse', key: 'C' },
  { id: 'text', label: 'Text', key: 'T' },
]

/**
 * Tools whose style matters (shows the style panel). Deliberately excludes `edit`
 * — editing changes geometry, not the look of new strokes.
 */
export const STYLE_TOOLS: ReadonlySet<ToolId> = new Set([
  'brush',
  'eraser',
  'line',
  'arrow',
  'rect',
  'ellipse',
  'text',
])

/**
 * Tools handled by the screen-space drawing hook (`useDrawingInteractions`).
 * Deliberately does NOT include `select`, so the hook stays silent and every
 * pointer/keyboard gesture goes to explore's picking / band-select / shortcuts.
 */
export const ELEMENT_TOOLS: ReadonlySet<ToolId> = new Set([
  'edit',
  'brush',
  'eraser',
  'line',
  'arrow',
  'rect',
  'ellipse',
  'text',
])

/**
 * Tools handled by the surface drawing hook (`SurfaceDrawingSurface`).
 *
 *   brush   — raycasts against the model, accumulates points into a stroke
 *   eraser  — raycasts against existing surface strokes, deletes the pick
 *   edit    — picks a stroke, selects it, drag-translates it on a camera plane
 *
 * Other drawing tools are intentionally absent: they have no 3D analogue.
 */
export const SURFACE_TOOLS: ReadonlySet<ToolId> = new Set(['brush', 'eraser', 'edit'])
