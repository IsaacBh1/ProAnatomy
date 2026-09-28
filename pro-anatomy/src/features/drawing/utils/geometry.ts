// src/features/drawing/utils/geometry.ts
import { HIT_TOLERANCE } from '../constants'
import type {
  Bbox,
  DrawElement,
  EllipseElement,
  Point,
  RectElement,
  TextElement,
} from '../types'

export const distanceToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

const pointsBbox = (points: readonly [number, number][]): Bbox => {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Approximate metrics for the text box. Good enough for selection outlines. */
export const measureText = (text: string, fontSize: number) => ({
  width: Math.max(fontSize * 0.6, text.length * fontSize * 0.55),
  height: fontSize * 1.25,
})

export function bboxOf(el: DrawElement): Bbox {
  switch (el.type) {
    case 'freehand':
      return pointsBbox(el.points)
    case 'line':
    case 'arrow':
      return {
        x: Math.min(el.x1, el.x2),
        y: Math.min(el.y1, el.y2),
        width: Math.abs(el.x2 - el.x1),
        height: Math.abs(el.y2 - el.y1),
      }
    case 'rect':
      return {
        x: Math.min(el.x, el.x + el.width),
        y: Math.min(el.y, el.y + el.height),
        width: Math.abs(el.width),
        height: Math.abs(el.height),
      }
    case 'ellipse':
      return {
        x: el.cx - el.rx,
        y: el.cy - el.ry,
        width: el.rx * 2,
        height: el.ry * 2,
      }
    case 'text': {
      const { width, height } = measureText(el.text || ' ', el.fontSize)
      return { x: el.x, y: el.y - height + el.fontSize * 0.25, width, height }
    }
  }
}

export function hitTest(el: DrawElement, p: Point, tolerance = HIT_TOLERANCE): boolean {
  switch (el.type) {
    case 'freehand': {
      if (el.points.length === 0) return false
      if (el.points.length === 1) {
        const [x, y] = el.points[0]
        return Math.hypot(p.x - x, p.y - y) <= tolerance + el.style.strokeWidth
      }
      const tol = tolerance + el.style.strokeWidth
      for (let i = 1; i < el.points.length; i++) {
        const a = { x: el.points[i - 1][0], y: el.points[i - 1][1] }
        const b = { x: el.points[i][0], y: el.points[i][1] }
        if (distanceToSegment(p, a, b) <= tol) return true
      }
      return false
    }
    case 'line':
    case 'arrow':
      return (
        distanceToSegment(p, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }) <=
        tolerance + el.style.strokeWidth
      )
    case 'rect': {
      const b = bboxOf(el)
      const inside =
        p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height
      if (!inside) return false
      // If filled, the whole box is a hit. Otherwise only near the border.
      if (el.style.fill) return true
      const nearLeft = Math.abs(p.x - b.x) <= tolerance + el.style.strokeWidth
      const nearRight = Math.abs(p.x - (b.x + b.width)) <= tolerance + el.style.strokeWidth
      const nearTop = Math.abs(p.y - b.y) <= tolerance + el.style.strokeWidth
      const nearBottom = Math.abs(p.y - (b.y + b.height)) <= tolerance + el.style.strokeWidth
      return nearLeft || nearRight || nearTop || nearBottom
    }
    case 'ellipse': {
      const e = el as EllipseElement
      if (e.rx === 0 || e.ry === 0) return false
      const nx = (p.x - e.cx) / e.rx
      const ny = (p.y - e.cy) / e.ry
      const d = nx * nx + ny * ny
      if (d > 1.3) return false
      if (el.style.fill) return true
      // Ring: keep only points near the boundary.
      return Math.abs(Math.sqrt(d) - 1) <= (tolerance + el.style.strokeWidth) / Math.min(e.rx, e.ry)
    }
    case 'text': {
      const t = el as TextElement
      const b = bboxOf(t)
      return p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height
    }
  }
}

/** Topmost element under the point (last in the array = top of z-order). */
export function findTopElementAt(
  elements: readonly DrawElement[],
  p: Point,
  tolerance = HIT_TOLERANCE,
): DrawElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTest(elements[i], p, tolerance)) return elements[i]
  }
  return null
}

export interface Handle {
  id: string
  x: number
  y: number
  cursor: string
}

/** Corners of a rectangle, ordered nw, ne, se, sw. Used for rect and ellipse resize handles. */
const cornerHandles = (b: Bbox): Handle[] => [
  { id: 'nw', x: b.x, y: b.y, cursor: 'nwse-resize' },
  { id: 'ne', x: b.x + b.width, y: b.y, cursor: 'nesw-resize' },
  { id: 'se', x: b.x + b.width, y: b.y + b.height, cursor: 'nwse-resize' },
  { id: 'sw', x: b.x, y: b.y + b.height, cursor: 'nesw-resize' },
]

export function handlesOf(el: DrawElement): Handle[] {
  switch (el.type) {
    case 'line':
    case 'arrow':
      return [
        { id: 'p1', x: el.x1, y: el.y1, cursor: 'crosshair' },
        { id: 'p2', x: el.x2, y: el.y2, cursor: 'crosshair' },
      ]
    case 'rect':
      return cornerHandles(bboxOf(el))
    case 'ellipse':
      return cornerHandles(bboxOf(el))
    case 'text':
      return [{ id: 'move', x: el.x, y: el.y, cursor: 'move' }]
    case 'freehand':
      return []
  }
}

/** Translate any element by (dx, dy). */
export function translateElement(el: DrawElement, dx: number, dy: number): DrawElement {
  switch (el.type) {
    case 'freehand':
      return { ...el, points: el.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) }
    case 'line':
    case 'arrow':
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }
    case 'rect':
      return { ...el, x: el.x + dx, y: el.y + dy }
    case 'ellipse':
      return { ...el, cx: el.cx + dx, cy: el.cy + dy }
    case 'text':
      return { ...el, x: el.x + dx, y: el.y + dy }
  }
}

/**
 * Apply a handle drag. `origin` is the element at pointerdown, `p` is the pointer now.
 * Pure: given the same inputs, returns the same element. This is what makes the whole
 * resize interaction testable and easy to reason about.
 */
export function applyHandleDrag(
  origin: DrawElement,
  handleId: string,
  p: Point,
): DrawElement {
  switch (origin.type) {
    case 'line':
    case 'arrow': {
      if (handleId === 'p1') return { ...origin, x1: p.x, y1: p.y }
      if (handleId === 'p2') return { ...origin, x2: p.x, y2: p.y }
      return origin
    }
    case 'rect': {
      const r = origin as RectElement
      let x1 = r.x
      let y1 = r.y
      let x2 = r.x + r.width
      let y2 = r.y + r.height
      if (handleId.includes('n')) y1 = p.y
      if (handleId.includes('s')) y2 = p.y
      if (handleId.includes('w')) x1 = p.x
      if (handleId.includes('e')) x2 = p.x
      return {
        ...r,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      }
    }
    case 'ellipse': {
      const e = origin as EllipseElement
      const x1 = e.cx - e.rx
      const y1 = e.cy - e.ry
      const x2 = e.cx + e.rx
      const y2 = e.cy + e.ry
      let nx1 = x1, ny1 = y1, nx2 = x2, ny2 = y2
      if (handleId.includes('n')) ny1 = p.y
      if (handleId.includes('s')) ny2 = p.y
      if (handleId.includes('w')) nx1 = p.x
      if (handleId.includes('e')) nx2 = p.x
      return {
        ...e,
        cx: (nx1 + nx2) / 2,
        cy: (ny1 + ny2) / 2,
        rx: Math.abs(nx2 - nx1) / 2,
        ry: Math.abs(ny2 - ny1) / 2,
      }
    }
    case 'text':
      return { ...origin, x: p.x, y: p.y }
    case 'freehand':
      return origin
  }
}

/** Union bbox over several elements — used to outline a multi-selection. */
export function unionBbox(elements: readonly DrawElement[]): Bbox | null {
  if (elements.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    const b = bboxOf(el)
    if (b.x < minX) minX = b.x
    if (b.y < minY) minY = b.y
    if (b.x + b.width > maxX) maxX = b.x + b.width
    if (b.y + b.height > maxY) maxY = b.y + b.height
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
