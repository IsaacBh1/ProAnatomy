import { describe, expect, it } from 'vitest'
import { buildCompoundOrgans } from './parseCompoundOrgans'

describe('buildCompoundOrgans', () => {
  const known = new Set(['FJ1', 'FJ2'])

  it('accepts array rows and object rows', () => {
    const result = buildCompoundOrgans(
      [[['FMA1', 'heart', 'FJ1']], [{ concept_id: 'FMA1', name: 'heart', element_file_id: 'FJ2' }]],
      known,
    )
    expect(result).toEqual([{ id: 'FMA1', name: 'heart', partIds: ['FJ1', 'FJ2'] }])
  })

  it('ignores parts that are not in the atlas', () => {
    expect(buildCompoundOrgans([[['FMA1', 'heart', 'FJ999']]], known)).toEqual([])
  })

  it('lets later sources rename a concept', () => {
    const [organ] = buildCompoundOrgans([[['FMA1', 'old', 'FJ1']], [['FMA1', 'new', 'FJ1']]], known)
    expect(organ.name).toBe('new')
  })
})
