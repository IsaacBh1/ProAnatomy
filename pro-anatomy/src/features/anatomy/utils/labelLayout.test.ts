import { describe, expect, it } from 'vitest'
import { LABELS } from '../constants/labels'
import type { LabelAnchor, LabelSide } from '../types/labels'
import {
  chooseSide,
  layoutLabels,
  sameLabels,
  spreadVertically,
  truncateName,
} from './labelLayout'

const anchor = (id: string, x: number, y: number, over: Partial<LabelAnchor> = {}): LabelAnchor => ({
  id,
  name: id,
  x,
  y,
  priority: 0,
  distance: 1,
  ...over,
})

const viewport = { width: 800, height: 600 }
const noSides = new Map<string, LabelSide>()

describe('chooseSide', () => {
  it('starts on the side the anchor is on', () => {
    expect(chooseSide(undefined, 100, 400)).toBe('left')
    expect(chooseSide(undefined, 700, 400)).toBe('right')
  })

  it('sticks to the previous side inside the hysteresis band', () => {
    expect(chooseSide('left', 420, 400)).toBe('left')
    expect(chooseSide('right', 380, 400)).toBe('right')
  })

  it('flips once the anchor is clearly on the other side', () => {
    expect(chooseSide('left', 500, 400)).toBe('right')
    expect(chooseSide('right', 300, 400)).toBe('left')
  })
})

describe('spreadVertically', () => {
  it('pushes overlapping labels apart', () => {
    expect(spreadVertically([100, 100, 100], 15, 10, 500)).toEqual([100, 115, 130])
  })

  it('pulls labels back up when the bottom overflows', () => {
    expect(spreadVertically([490, 495, 500], 15, 10, 500)).toEqual([470, 485, 500])
  })

  it('respects the top edge', () => {
    expect(spreadVertically([0], 15, 10, 500)).toEqual([10])
  })
})

describe('layoutLabels', () => {
  it('keeps at most maxCount, preferring priority and then the nearest', () => {
    const items = layoutLabels(
      [
        anchor('far', 100, 100, { distance: 9 }),
        anchor('near', 100, 200, { distance: 1 }),
        anchor('selected', 100, 300, { distance: 50, priority: 2 }),
      ],
      { viewport, previousSides: noSides, maxCount: 2 },
    )
    expect(items.map((i) => i.id).sort()).toEqual(['near', 'selected'])
  })

  it('never overlaps two labels in the same column', () => {
    const anchors = Array.from({ length: 10 }, (_, i) => anchor(`p${i}`, 100, 300))
    const rows = layoutLabels(anchors, { viewport, previousSides: noSides })
      .map((i) => i.labelY)
      .sort((a, b) => a - b)

    rows.slice(1).forEach((y, i) => expect(y - rows[i]).toBeGreaterThanOrEqual(LABELS.lineHeight))
  })

  it('keeps labels inside the viewport', () => {
    const anchors = Array.from({ length: 5 }, (_, i) => anchor(`p${i}`, 100, 595))
    const items = layoutLabels(anchors, { viewport, previousSides: noSides })

    for (const { labelY } of items) {
      expect(labelY).toBeLessThanOrEqual(viewport.height - LABELS.edgePadding - LABELS.lineHeight / 2)
    }
  })

  it('keeps a label on its previous side inside the hysteresis band', () => {
    const [item] = layoutLabels([anchor('a', 420, 100)], {
      viewport,
      previousSides: new Map<string, LabelSide>([['a', 'left']]),
    })
    expect(item.side).toBe('left')
  })
})

describe('sameLabels / truncateName', () => {
  const label = { id: 'a', name: 'a', side: 'left', anchorX: 1, anchorY: 2, labelY: 3 } as const

  it('ignores sub-pixel movement but not real movement', () => {
    expect(sameLabels([label], [{ ...label, anchorX: 1.2 }])).toBe(true)
    expect(sameLabels([label], [{ ...label, anchorX: 5 }])).toBe(false)
  })

  it('shortens long names with an ellipsis', () => {
    expect(truncateName('abcdefghij', 5)).toBe('abcd…')
    expect(truncateName('abc', 5)).toBe('abc')
  })
})
