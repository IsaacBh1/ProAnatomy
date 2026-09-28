import type { LabelItem } from '../types/labels'
import { labelGeometry } from './labelLayout'

export interface CanvasPalette {
  text: string
  halo: string
  line: string
  fontFamily: string
}

/** Draws the same labels as the SVG overlay onto a 2D canvas. `ratio` = canvas pixels per CSS pixel. */
export function drawLabels(
  ctx: CanvasRenderingContext2D,
  items: readonly LabelItem[],
  ratio: number,
  palette: CanvasPalette,
): void {
  ctx.save()
  ctx.font = `600 ${11 * ratio}px ${palette.fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (const item of items) {
    const { side, elbowX, tickX, textX } = labelGeometry(item)
    const ax = item.anchorX * ratio
    const ay = item.anchorY * ratio
    const ly = item.labelY * ratio

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(elbowX * ratio, ly)
    ctx.lineTo(tickX * ratio, ly)
    ctx.strokeStyle = palette.line
    ctx.lineWidth = 1.1 * ratio
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(ax, ay, 2.6 * ratio, 0, Math.PI * 2)
    ctx.fillStyle = palette.text
    ctx.strokeStyle = palette.halo
    ctx.lineWidth = 1.2 * ratio
    ctx.fill()
    ctx.stroke()

    ctx.textAlign = side === 'left' ? 'right' : 'left'
    ctx.strokeStyle = palette.halo
    ctx.lineWidth = 3.5 * ratio
    ctx.strokeText(item.name, textX * ratio, ly)
    ctx.fillStyle = palette.text
    ctx.fillText(item.name, textX * ratio, ly)
  }
  ctx.restore()
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ratio: number,
  palette: CanvasPalette,
): void {
  const padding = 14 * ratio
  ctx.save()
  ctx.font = `600 ${12 * ratio}px ${palette.fontFamily}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.globalAlpha = 0.75
  ctx.lineJoin = 'round'
  ctx.strokeStyle = palette.halo
  ctx.lineWidth = 3 * ratio
  ctx.strokeText('ProAnatomy', width - padding, height - padding)
  ctx.fillStyle = palette.text
  ctx.fillText('ProAnatomy', width - padding, height - padding)
  ctx.restore()
}
