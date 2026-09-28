// src/features/drawing/types.ts
export type ElementId = string
export type DashStyle = 'solid' | 'dashed' | 'dotted'

export interface ElementStyle {
  stroke: string
  fill: string | null
  strokeWidth: number
  dash: DashStyle
  opacity: number
}

interface BaseElement {
  id: ElementId
  style: ElementStyle
  createdAt: number
}

export interface FreehandElement extends BaseElement {
  type: 'freehand'
  points: readonly [number, number][]
}
export interface LineElement extends BaseElement {
  type: 'line'
  x1: number; y1: number; x2: number; y2: number
}
export interface ArrowElement extends BaseElement {
  type: 'arrow'
  x1: number; y1: number; x2: number; y2: number
}
export interface RectElement extends BaseElement {
  type: 'rect'
  x: number; y: number; width: number; height: number
}
export interface EllipseElement extends BaseElement {
  type: 'ellipse'
  cx: number; cy: number; rx: number; ry: number
}
export interface TextElement extends BaseElement {
  type: 'text'
  x: number; y: number
  text: string
  fontSize: number
}

export type DrawElement =
  | FreehandElement
  | LineElement
  | ArrowElement
  | RectElement
  | EllipseElement
  | TextElement

export type DrawElementType = DrawElement['type']

/**
 * Draw-mode tools.
 *
 *   orbit/zoom/pan — same as explore, same shortcuts (O/Z/H)
 *   select         — same as explore, same shortcut (V). Organs only.
 *   brush/eraser/line/arrow/rect/ellipse/text — create/remove annotations.
 *
 * There is intentionally no "edit drawings" tool yet — that design is TBD.
 */
export type ToolId =
  | 'orbit'
  | 'zoom'
  | 'pan'
  | 'select'
  | 'brush'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'text'

export interface Point { x: number; y: number }
export interface Bbox { x: number; y: number; width: number; height: number }
export type Vec3 = readonly [number, number, number]

export interface SurfaceStroke {
  id: string
  targetPartId?: string
  points: readonly Vec3[]
  style: ElementStyle
  createdAt: number
}

export interface DrawingSnapshot {
  elements: readonly DrawElement[]
  surfaceStrokes: readonly SurfaceStroke[]
}

export interface DrawingDocument {
  version: 1
  elements: readonly DrawElement[]
  surfaceStrokes: readonly SurfaceStroke[]
}
