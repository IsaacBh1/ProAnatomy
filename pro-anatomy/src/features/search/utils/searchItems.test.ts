import { describe, expect, it } from 'vitest'
import type { SearchableItem } from '../types'
import { buildSearchIndex, searchIndex } from './searchItems'

const items: SearchableItem[] = [
  { id: 'FJ1', name: 'Heart', system: 'cardiac' },
  { id: 'FJ2', name: 'Heart valve', system: 'cardiac' },
  { id: 'FJ3', name: 'Left lung', system: 'respiratory' },
  { id: 'FJ4', name: 'Aortic arch near heart', system: 'arterial' },
]
const index = buildSearchIndex(items)
const names = (query: string, limit?: number) =>
  searchIndex(index, query, limit).map((r) => r.item.name)

describe('searchIndex', () => {
  it('ranks prefix matches above inner matches', () => {
    expect(names('heart')).toEqual(['Heart', 'Heart valve', 'Aortic arch near heart'])
  })

  it('requires every token to match', () => {
    expect(names('left heart')).toEqual([])
    expect(names('valve heart')).toEqual(['Heart valve'])
  })

  it('matches on id and on system', () => {
    expect(names('fj3')).toEqual(['Left lung'])
    expect(names('respiratory')).toEqual(['Left lung'])
  })

  it('is case-insensitive and ignores blank queries', () => {
    expect(names('LUNG')).toEqual(['Left lung'])
    expect(names('   ')).toEqual([])
  })

  it('respects the limit', () => {
    expect(names('heart', 2)).toHaveLength(2)
  })
})
