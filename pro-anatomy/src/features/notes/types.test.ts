import { describe, expect, it } from 'vitest'
import { anchorContainsPart, anchorKey, anchorsEqual } from './types'

describe('anchorKey', () => {
  it('is order-independent for part sets', () => {
    expect(anchorKey({ kind: 'parts', ids: ['a', 'b'] })).toBe(
      anchorKey({ kind: 'parts', ids: ['b', 'a'] }),
    )
  })

  it('is distinct per kind', () => {
    expect(anchorKey({ kind: 'free' })).toBe('free')
    expect(anchorKey({ kind: 'system', id: 'cardiac' })).toBe('system:cardiac')
    expect(anchorKey({ kind: 'parts', ids: ['x'] })).toBe('parts:x')
  })
})

describe('anchorsEqual', () => {
  it('compares by key', () => {
    expect(
      anchorsEqual({ kind: 'parts', ids: ['a', 'b'] }, { kind: 'parts', ids: ['b', 'a'] }),
    ).toBe(true)
    expect(anchorsEqual({ kind: 'free' }, { kind: 'system', id: 'other' })).toBe(false)
  })
})

describe('anchorContainsPart', () => {
  it('only matches part anchors', () => {
    expect(anchorContainsPart({ kind: 'parts', ids: ['a'] }, 'a')).toBe(true)
    expect(anchorContainsPart({ kind: 'parts', ids: ['a'] }, 'b')).toBe(false)
    expect(anchorContainsPart({ kind: 'free' }, 'a')).toBe(false)
    expect(anchorContainsPart({ kind: 'system', id: 'cardiac' }, 'a')).toBe(false)
  })
})
