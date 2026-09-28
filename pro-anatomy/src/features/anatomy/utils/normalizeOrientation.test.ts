import { BoxGeometry, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { normalizeOrientation } from './normalizeOrientation'

describe('normalizeOrientation', () => {
  it('turns a Z-long model so its longest axis is Y', () => {
    const geometry = new BoxGeometry(1, 1, 3)
    normalizeOrientation([{ id: 'a', name: 'a', system: 'other', geometry }])

    geometry.computeBoundingBox()
    expect(geometry.boundingBox?.getSize(new Vector3()).y).toBeCloseTo(3)
  })
})
