import { describe, expect, it } from 'vitest'
import type {
  ArrowElement,
  ElementStyle,
  EllipseElement,
  FreehandElement,
  LineElement,
  RectElement,
  TextElement,
} from '../types'
import { applyHandleDrag, bboxOf, hitTest, translateElement, unionBbox } from './geometry'

const style: ElementStyle = {
  stroke: '#000',
  fill: null,
  strokeWidth: 2,
  dash: 'solid',
  opacity: 1,
}

const line = (over: Partial<LineElement> = {}): LineElement => ({
  id: 'l',
  type: 'line',
  style,
  createdAt: 0,
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  ...over,
})

const arrow = (over: Partial<ArrowElement> = {}): ArrowElement => ({
  id: 'a',
  type: 'arrow',
  style,
  createdAt: 0,
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  ...over,
})

const rect = (over: Partial<RectElement> = {}): RectElement => ({
  id: 'r',
  type: 'rect',
  style,
  createdAt: 0,
  x: 10,
  y: 20,
  width: 30,
  height: 40,
  ...over,
})

const ellipse = (over: Partial<EllipseElement> = {}): EllipseElement => ({
  id: 'e',
  type: 'ellipse',
  style,
  createdAt: 0,
  cx: 50,
  cy: 50,
  rx: 20,
  ry: 10,
  ...over,
})

const text = (over: Partial<TextElement> = {}): TextElement => ({
  id: 't',
  type: 'text',
  style,
  createdAt: 0,
  x: 5,
  y: 5,
  text: 'hello',
  fontSize: 16,
  ...over,
})

const freehand = (over: Partial<FreehandElement> = {}): FreehandElement => ({
  id: 'f',
  type: 'freehand',
  style,
  createdAt: 0,
  points: [
    [0, 0],
    [10, 0],
    [10, 10],
  ],
  ...over,
})

describe('bboxOf', () => {
  it('is empty for a freehand with no points', () => {
    expect(bboxOf(freehand({ points: [] }))).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('covers the freehand point extents', () => {
    expect(bboxOf(freehand())).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  it('handles a line drawn right-to-left', () => {
    expect(bboxOf(line({ x1: 10, y1: 10, x2: 0, y2: 0 }))).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    })
  })

  it('normalises a negative-size rect', () => {
    expect(bboxOf(rect({ x: 30, y: 40, width: -20, height: -10 }))).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 10,
    })
  })

  it('uses the radii for an ellipse', () => {
    expect(bboxOf(ellipse())).toEqual({ x: 30, y: 40, width: 40, height: 20 })
  })
})

describe('translateElement', () => {
  it('shifts every point of a freehand', () => {
    const moved = translateElement(freehand(), 5, -3) as FreehandElement
    expect(moved.points).toEqual([
      [5, -3],
      [15, -3],
      [15, 7],
    ])
  })

  it('shifts both ends of a line', () => {
    expect(translateElement(line(), 1, 2)).toMatchObject({ x1: 1, y1: 2, x2: 11, y2: 12 })
  })

  it('shifts both ends of an arrow (arrow uses line geometry)', () => {
    expect(translateElement(arrow(), 1, 2)).toMatchObject({ x1: 1, y1: 2, x2: 11, y2: 12 })
  })

  it('shifts the top-left corner of a rect and leaves size untouched', () => {
    const moved = translateElement(rect(), 5, 5) as RectElement
    expect(moved).toMatchObject({ x: 15, y: 25, width: 30, height: 40 })
  })

  it('shifts the centre of an ellipse and leaves radii untouched', () => {
    const moved = translateElement(ellipse(), -10, 10) as EllipseElement
    expect(moved).toMatchObject({ cx: 40, cy: 60, rx: 20, ry: 10 })
  })

  it('shifts a text anchor', () => {
    expect(translateElement(text(), 3, 4)).toMatchObject({ x: 8, y: 9 })
  })
})

describe('hitTest', () => {
  it('hits a line near it and misses away from it', () => {
    expect(hitTest(line(), { x: 5, y: 5 })).toBe(true)
    expect(hitTest(line(), { x: 100, y: 100 })).toBe(false)
  })

  it('hits a single-point freehand only at the point', () => {
    expect(hitTest(freehand({ points: [[5, 5]] }), { x: 5, y: 5 })).toBe(true)
    expect(hitTest(freehand({ points: [[5, 5]] }), { x: 20, y: 20 })).toBe(false)
  })

  it('hits an unfilled rect only near its border', () => {
    const r = rect()
    expect(hitTest(r, { x: 10, y: 20 })).toBe(true) // top-left corner
    expect(hitTest(r, { x: 25, y: 40 })).toBe(false) // dead centre
  })

  it('hits anywhere inside a filled rect', () => {
    const r = rect({ style: { ...style, fill: '#fff' } })
    expect(hitTest(r, { x: 25, y: 40 })).toBe(true)
  })

  it('hits an ellipse only near its ring when unfilled', () => {
    const e = ellipse()
    expect(hitTest(e, { x: 70, y: 50 })).toBe(true) // right edge
    expect(hitTest(e, { x: 50, y: 50 })).toBe(false) // centre
  })

  it('hits anywhere inside a filled ellipse', () => {
    const e = ellipse({ style: { ...style, fill: '#fff' } })
    expect(hitTest(e, { x: 50, y: 50 })).toBe(true)
  })
})

describe('applyHandleDrag', () => {
  it('moves the p1 endpoint of a line without touching p2', () => {
    const result = applyHandleDrag(line(), 'p1', { x: 100, y: 100 }) as LineElement
    expect(result).toMatchObject({ x1: 100, y1: 100, x2: 10, y2: 10 })
  })

  it('moves the p2 endpoint of an arrow without touching p1', () => {
    const result = applyHandleDrag(arrow(), 'p2', { x: 100, y: 100 }) as ArrowElement
    expect(result).toMatchObject({ x1: 0, y1: 0, x2: 100, y2: 100 })
  })

  it('resizes a rect from its south-east corner', () => {
    const result = applyHandleDrag(rect(), 'se', { x: 80, y: 80 }) as RectElement
    // Original: x=10 y=20 w=30 h=40 → SE corner was (40, 60).
    // Drag SE to (80, 80) → x=10 y=20 w=70 h=60.
    expect(result).toEqual({ ...rect(), x: 10, y: 20, width: 70, height: 60 })
  })

  it('flips a rect to normalised coordinates when the pointer crosses the far side', () => {
    const result = applyHandleDrag(rect(), 'se', { x: 0, y: 100 }) as RectElement
    // Drag SE left of the rect: x1 becomes 0 (from p), x2 stays 40.
    // Result should be normalised, not negative.
    expect(result.x).toBe(0)
    expect(result.width).toBe(10)
  })

  it('resizes an ellipse from its north-east corner', () => {
    const result = applyHandleDrag(ellipse(), 'ne', { x: 100, y: 20 }) as EllipseElement
    // Original: cx=50 cy=50 rx=20 ry=10 → bbox (30,40)-(70,60).
    // NE drag to (100, 20): x2→100, y1→20 → x1=30 stays, y2=60 stays.
    // New centre: (65, 40), radii: (35, 20).
    expect(result).toMatchObject({ cx: 65, cy: 40, rx: 35, ry: 20 })
  })

  it('is a no-op for a freehand (no handles by design)', () => {
    const original = freehand()
    expect(applyHandleDrag(original, 'p1', { x: 100, y: 100 })).toEqual(original)
  })
})

describe('unionBbox', () => {
  it('returns null for an empty list', () => {
    expect(unionBbox([])).toBeNull()
  })

  it('covers every input', () => {
    expect(
      unionBbox([
        rect({ x: 0, y: 0, width: 10, height: 10 }),
        rect({ x: 20, y: 5, width: 10, height: 20 }),
      ]),
    ).toEqual({ x: 0, y: 0, width: 30, height: 25 })
  })

  it('uses the union of heterogeneous elements', () => {
    expect(unionBbox([line(), ellipse()])).toEqual({
      x: 0,
      y: 0,
      width: 70,
      height: 60,
    })
  })
})
