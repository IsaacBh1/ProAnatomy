// src/features/drawing/utils/freehand.ts
import { getStroke } from 'perfect-freehand'

/**
 * perfect-freehand returns a ring of outline points. Convert to an SVG path using the classic
 * midpoint-quadratic technique — smooth, closed, and independent of input length.
 */
export function freehandToSvgPath(
  points: readonly [number, number][],
  strokeWidth: number,
): string {
  if (points.length < 2) return ''
  const outline = getStroke(points as [number, number][], {
    size: strokeWidth * 2,
    thinning: 0.35,
    smoothing: 0.5,
    streamline: 0.4,
    simulatePressure: true,
    last: true,
  })
  if (outline.length === 0) return ''

  const d: string[] = [`M ${outline[0][0].toFixed(2)} ${outline[0][1].toFixed(2)}`]
  for (let i = 1; i < outline.length; i++) {
    const [x0, y0] = outline[i - 1]
    const [x1, y1] = outline[i]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d.push(`Q ${x0.toFixed(2)} ${y0.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`)
  }
  d.push('Z')
  return d.join(' ')
}
