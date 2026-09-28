import { BoxGeometry, PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import { EMPTY_TAXONOMY } from '../services/bodyparts3d/taxonomy'
import { buildModelObject } from './buildModelObject'
import { collectPartsInRect } from './collectPartsInRect'

const part = (id: string, x: number, z = 0) => ({
  id,
  name: id,
  system: 'other' as const,
  geometry: new BoxGeometry(1, 1, 1).translate(x, 0, z),
})

describe('collectPartsInRect', () => {
  const { entries } = buildModelObject({
    parts: [part('center', 0), part('right', 3), part('behind', 0, 20)],
    compounds: [],
    taxonomy: EMPTY_TAXONOMY,
  })
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  it('selects only visible parts whose centre is inside the rectangle', () => {
    const hits = collectPartsInRect(
      entries,
      camera,
      { x: 300, y: 300, width: 200, height: 200 },
      { width: 800, height: 800 },
    )
    // "behind" projects onto the same pixels but sits behind the camera.
    expect([...hits]).toEqual(['center'])
  })
})
