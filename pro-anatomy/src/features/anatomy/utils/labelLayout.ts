import { LABELS } from '../constants/labels'
import type { LabelAnchor, LabelItem, LabelSide, ViewportSize } from '../types/labels'

export const truncateName = (name: string, max: number = LABELS.maxNameLength): string =>
  name.length > max ? `${name.slice(0, max - 1)}…` : name

export function chooseSide(previous: LabelSide | undefined, x: number, centerX: number): LabelSide {
  if (!previous) return x < centerX ? 'left' : 'right'
  if (previous === 'left' && x > centerX + LABELS.sideHysteresis) return 'right'
  if (previous === 'right' && x < centerX - LABELS.sideHysteresis) return 'left'
  return previous
}

export function spreadVertically(
  anchors: readonly number[],
  spacing: number,
  min: number,
  max: number,
): number[] {
  const ys: number[] = []
  anchors.forEach((y, i) => ys.push(Math.max(y, i === 0 ? min : ys[i - 1] + spacing)))

  for (let i = ys.length - 1; i >= 0; i--) {
    const limit = i === ys.length - 1 ? max : ys[i + 1] - spacing
    if (ys[i] > limit) ys[i] = limit
  }
  return ys
}

interface LayoutOptions {
  viewport: ViewportSize
  previousSides: ReadonlyMap<string, LabelSide>
  maxCount?: number
  pinnedIds?: ReadonlySet<string>
}

export function layoutLabels(
  anchors: readonly LabelAnchor[],
  { viewport, previousSides, maxCount = LABELS.maxCount, pinnedIds }: LayoutOptions,
): LabelItem[] {
  const sorted = [...anchors].sort((a, b) => b.priority - a.priority || a.distance - b.distance)
  const seen = new Set<string>()
  const chosen: LabelAnchor[] = []
  for (const anchor of sorted) {
    if (seen.has(anchor.name)) continue
    seen.add(anchor.name)
    chosen.push(anchor)
    if (chosen.length >= maxCount) break
  }

  const centerX = viewport.width / 2
  const columns: Record<LabelSide, LabelAnchor[]> = { left: [], right: [] }
  for (const anchor of chosen) {
    columns[chooseSide(previousSides.get(anchor.id), anchor.x, centerX)].push(anchor)
  }

  const min = LABELS.edgePadding + LABELS.lineHeight / 2
  const max = viewport.height - LABELS.edgePadding - LABELS.lineHeight / 2

  const items: LabelItem[] = []
  for (const side of ['left', 'right'] as const) {
    const column = columns[side].sort((a, b) => a.y - b.y)
    const rows = spreadVertically(
      column.map((anchor) => anchor.y),
      LABELS.lineHeight + 1,
      min,
      max,
    )
    column.forEach((anchor, i) =>
      items.push({
        id: anchor.id,
        name: anchor.name,
        side,
        anchorX: anchor.x,
        anchorY: anchor.y,
        labelY: rows[i],
        pinned: pinnedIds?.has(anchor.id),
      }),
    )
  }
  return items
}

export function labelGeometry(item: LabelItem) {
  const sign = item.side === 'left' ? -1 : 1
  const elbowX = item.anchorX + sign * LABELS.elbowOffset
  const tickX = elbowX + sign * LABELS.tickLength
  return { side: item.side, elbowX, tickX, textX: tickX + sign * LABELS.textGap }
}

export function sameLabels(
  a: readonly LabelItem[],
  b: readonly LabelItem[],
  tolerance = 0.5,
): boolean {
  return (
    a.length === b.length &&
    a.every((x, i) => {
      const y = b[i]
      return (
        x.id === y.id &&
        x.pinned === y.pinned &&
        x.side === y.side &&
        Math.abs(x.anchorX - y.anchorX) < tolerance &&
        Math.abs(x.anchorY - y.anchorY) < tolerance &&
        Math.abs(x.labelY - y.labelY) < tolerance
      )
    })
  )
}
