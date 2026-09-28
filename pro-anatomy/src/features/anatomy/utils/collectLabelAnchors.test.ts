import { BoxGeometry, PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import type { SystemId } from '@/types/anatomy'
import { EMPTY_TAXONOMY } from '../services/bodyparts3d/taxonomy'
import { buildModelObject } from './buildModelObject'
import { collectLabelAnchors, computePartRadii } from './collectLabelAnchors'

const part = (id: string, size: number, x: number, z = 0, system: SystemId = 'other') => ({
  id,
  name: id,
  system,
  geometry: new BoxGeometry(size, size, size).translate(x, 0, z),
})

const { entries } = buildModelObject({
  parts: [
    part('big', 2, 0),
    part('tiny', 0.01, 1),
    part('skin', 6, 0, 0, 'integumentary'),
    part('behind', 2, 0, 20), // beyond the camera
  ],
  compounds: [],
  taxonomy: EMPTY_TAXONOMY,
})

const camera = new PerspectiveCamera(45, 1, 0.1, 100)
camera.position.set(0, 0, 10)
camera.lookAt(0, 0, 0)

const base = {
  entries,
  radii: computePartRadii(entries),
  minRadius: 0.5,
  camera,
  viewport: { width: 800, height: 800 },
  selectedIds: new Set<string>(),
  isolatedIds: null,
  calloutIds: new Set<string>(),
}

const ids = (context: Parameters<typeof collectLabelAnchors>[0]) =>
  collectLabelAnchors(context)
    .map((anchor) => anchor.id)
    .sort()

describe('collectLabelAnchors', () => {
  it('labels only large, visible parts in front of the camera', () => {
    expect(ids(base)).toEqual(['big'])
  })

  it('always labels selected parts, even tiny ones, with selection priority', () => {
    const context = { ...base, selectedIds: new Set(['tiny']) }
    expect(ids(context)).toEqual(['big', 'tiny'])
    expect(collectLabelAnchors(context).find((a) => a.id === 'tiny')?.priority).toBe(2)
  })

  it('treats every callout as a top-priority anchor', () => {
    const context = { ...base, calloutIds: new Set(['tiny', 'big']) }
    const anchors = collectLabelAnchors(context)
    expect(ids(context)).toEqual(['big', 'tiny'])
    expect(anchors.every((a) => a.priority === 3)).toBe(true)
  })

  it('labels skin only when it is isolated or called out', () => {
    expect(ids({ ...base, isolatedIds: new Set(['skin']) })).toContain('skin')
    expect(ids({ ...base, calloutIds: new Set(['skin']) })).toContain('skin')
    expect(ids(base)).not.toContain('skin')
  })

  it('skips hidden parts', () => {
    entries.get('big')!.mesh.visible = false
    expect(ids(base)).toEqual([])
    entries.get('big')!.mesh.visible = true
  })
})
