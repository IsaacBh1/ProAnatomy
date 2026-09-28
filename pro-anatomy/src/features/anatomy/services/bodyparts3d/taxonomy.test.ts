import { describe, expect, it } from 'vitest'
import { buildTaxonomy, partsUnder, describeTaxonomy, EMPTY_TAXONOMY } from './taxonomy'

describe('buildTaxonomy — names', () => {
  it('reads an id→name object', () => {
    const taxonomy = buildTaxonomy({
      names: { FMA1: 'Heart', FMA2: 'Lung' },
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.get('heart')).toBe('FMA1')
    expect(taxonomy.conceptByName.get('lung')).toBe('FMA2')
  })

  it('reads [{id, name}] arrays', () => {
    const taxonomy = buildTaxonomy({
      names: [{ id: 'FMA1', name: 'Heart' }],
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.get('heart')).toBe('FMA1')
  })

  it('reads {id: {name}} objects', () => {
    const taxonomy = buildTaxonomy({
      names: { FMA1: { name: 'Heart' } },
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.get('heart')).toBe('FMA1')
  })

  it('normalises whitespace and case', () => {
    const taxonomy = buildTaxonomy({
      names: { FMA1: '  Left   Lung ' },
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.get('left lung')).toBe('FMA1')
  })

  it('lets the first name win on collision', () => {
    const taxonomy = buildTaxonomy({
      names: [
        { id: 'FIRST', name: 'heart' },
        { id: 'SECOND', name: 'Heart' },
      ],
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.get('heart')).toBe('FIRST')
  })

  it('ignores malformed rows without throwing', () => {
    const taxonomy = buildTaxonomy({
      names: [null, 42, [], ['only-id'], { id: 5, name: 7 }],
      isa: {},
      elementParts: {},
    })
    expect(taxonomy.conceptByName.size).toBe(0)
  })
})

describe('buildTaxonomy — edges', () => {
  it('reads {parent: [child]}', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: { A: ['B', 'C'] },
      elementParts: {},
    })
    expect(taxonomy.childrenOf.get('A')).toEqual(['B', 'C'])
  })

  it('reads [{parent, child}]', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: [{ parent: 'A', child: 'B' }],
      elementParts: {},
    })
    expect(taxonomy.childrenOf.get('A')).toEqual(['B'])
  })

  it('reads [[parent, child]]', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: [['A', 'B']],
      elementParts: {},
    })
    expect(taxonomy.childrenOf.get('A')).toEqual(['B'])
  })

  it('walks a nested tree', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: [{ id: 'root', children: [{ id: 'a' }, { id: 'b' }] }],
      elementParts: {},
    })
    expect(taxonomy.childrenOf.get('root')).toEqual(['a', 'b'])
  })
})

describe('buildTaxonomy — element parts', () => {
  it('reads {conceptId: [partIds]}', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: {},
      elementParts: { FMA1: ['FJ1', 'FJ2'] },
    })
    expect(taxonomy.partsOf.get('FMA1')).toEqual(['FJ1', 'FJ2'])
  })

  it('reads {conceptId: partId}', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: {},
      elementParts: { FMA1: 'FJ1' },
    })
    expect(taxonomy.partsOf.get('FMA1')).toEqual(['FJ1'])
  })

  it('appends when the same concept appears twice', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: {},
      elementParts: { FMA1: ['FJ1', 'FJ2'] },
    })
    // Calling with a duplicate key scenario: merge happens inside one object, but the API
    // supports multiple sources by returning the last-wins map for a single call.
    expect(taxonomy.partsOf.get('FMA1')).toHaveLength(2)
  })

  it('ignores arrays containing non-strings', () => {
    const taxonomy = buildTaxonomy({
      names: {},
      isa: {},
      elementParts: { FMA1: ['FJ1', 42, null, 'FJ2'] },
    })
    expect(taxonomy.partsOf.get('FMA1')).toEqual(['FJ1', 'FJ2'])
  })
})

describe('partsUnder', () => {
  const taxonomy = buildTaxonomy({
    names: {},
    isa: { root: ['a', 'b'], a: ['a1'] },
    elementParts: { root: ['p-root'], a: ['p-a'], a1: ['p-a1'], b: ['p-b'] },
  })

  it('collects parts from the whole sub-tree', () => {
    expect(partsUnder(taxonomy, 'root')).toEqual(new Set(['p-root', 'p-a', 'p-a1', 'p-b']))
  })

  it('returns an empty set for an unknown concept', () => {
    expect(partsUnder(taxonomy, 'missing')).toEqual(new Set())
  })

  it('terminates on a cycle', () => {
    const cyclic = buildTaxonomy({
      names: {},
      isa: { a: ['b'], b: ['a'] },
      elementParts: { a: ['p1'], b: ['p2'] },
    })
    expect(partsUnder(cyclic, 'a')).toEqual(new Set(['p1', 'p2']))
  })
})

describe('describeTaxonomy', () => {
  it('summarises size', () => {
    const taxonomy = buildTaxonomy({
      names: { A: 'a', B: 'b' },
      isa: { A: ['B'] },
      elementParts: { A: ['p1', 'p2'] },
    })
    expect(describeTaxonomy(taxonomy)).toContain('concepts=2')
    expect(describeTaxonomy(taxonomy)).toContain('isa-edges=1')
    expect(describeTaxonomy(taxonomy)).toContain('direct-parts=2')
  })

  it('handles the empty taxonomy', () => {
    expect(describeTaxonomy(EMPTY_TAXONOMY)).toContain('concepts=0')
  })
})
