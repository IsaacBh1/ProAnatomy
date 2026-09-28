import { describe, expect, it } from 'vitest'
import type { ViewSnapshot } from '../types/view'
import { snapshotsEqual } from './viewSnapshot'

const base: ViewSnapshot = {
  selectedIds: ['a', 'b'],
  isolatedIds: null,
  hiddenIds: [],
  activePresetIds: [],
  pose: { position: [0, 0, 10], target: [0, 0, 0] },
}

describe('snapshotsEqual', () => {
  it('ignores id order', () => {
    expect(snapshotsEqual(base, { ...base, selectedIds: ['b', 'a'] })).toBe(true)
  })

  it('detects a different hidden set', () => {
    expect(snapshotsEqual(base, { ...base, hiddenIds: ['x'] })).toBe(false)
  })

  it('distinguishes "not isolated" from "isolated on nothing"', () => {
    expect(snapshotsEqual(base, { ...base, isolatedIds: [] })).toBe(false)
  })

  it('tolerates tiny camera differences but not real moves', () => {
    const nudged = { ...base, pose: { position: [0, 0, 10.001], target: [0, 0, 0] } as const }
    const moved = { ...base, pose: { position: [0, 0, 8], target: [0, 0, 0] } as const }
    expect(snapshotsEqual(base, nudged)).toBe(true)
    expect(snapshotsEqual(base, moved)).toBe(false)
  })
})
