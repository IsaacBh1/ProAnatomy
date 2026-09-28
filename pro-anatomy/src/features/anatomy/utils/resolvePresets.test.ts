import { describe, expect, it } from 'vitest'
import type { OrganPreset } from '../types'
import type { CompoundOrgan } from '../types/model'
import { EMPTY_TAXONOMY, type PartTaxonomy } from '../services/bodyparts3d/taxonomy'
import { resolveAvailablePresets } from './resolvePresets'

const preset = (id: string, ...matchNames: string[]): OrganPreset => ({ id, label: id, matchNames })
const compound = (name: string, ...partIds: string[]): CompoundOrgan => ({ id: name, name, partIds })

/** Model with no hierarchy: the resolver must fall back to the flat compound list. */
const flatModel = (compounds: readonly CompoundOrgan[]) => ({
  compounds,
  taxonomy: EMPTY_TAXONOMY,
})

/** Hand-built taxonomy, so the hierarchy tests don't depend on the real BodyParts3D files. */
const hierarchy = (options: {
  names: Record<string, string>
  children?: Record<string, readonly string[]>
  parts?: Record<string, readonly string[]>
}): PartTaxonomy => ({
  conceptByName: new Map(Object.entries(options.names).map(([name, id]) => [name.toLowerCase(), id])),
  childrenOf: new Map(Object.entries(options.children ?? {})),
  partsOf: new Map(Object.entries(options.parts ?? {})),
})

describe('resolveAvailablePresets — flat fallback (no taxonomy)', () => {
  it('prefers the smallest compound when names collide', () => {
    const result = resolveAvailablePresets(
      flatModel([compound('Heart', 'a', 'b', 'c'), compound('heart', 'a')]),
      [preset('heart', 'heart')],
    )
    expect(result[0].partIds).toEqual(['a'])
  })

  it('tries match names in order', () => {
    const result = resolveAvailablePresets(
      flatModel([compound('bladder', 'x'), compound('urinary bladder', 'y')]),
      [preset('bladder', 'urinary bladder', 'bladder')],
    )
    expect(result[0].partIds).toEqual(['y'])
  })

  it('falls back to a name prefix', () => {
    const result = resolveAvailablePresets(flatModel([compound('liver right lobe', 'z')]), [
      preset('liver', 'liver'),
    ])
    expect(result[0].partIds).toEqual(['z'])
  })

  it('drops presets the model cannot show', () => {
    expect(
      resolveAvailablePresets(flatModel([compound('heart', 'a')]), [preset('brain', 'brain')]),
    ).toEqual([])
  })
})

describe('resolveAvailablePresets — hierarchy', () => {
  it('includes parts of every descendant concept, not just the root', () => {
    // Heart has direct parts, plus children whose parts must also be collected.
    const taxonomy = hierarchy({
      names: { heart: 'FMA7088', 'heart wall': 'FMA7101', 'left ventricle': 'FMA7100' },
      children: { FMA7088: ['FMA7101'], FMA7101: ['FMA7100'] },
      parts: {
        FMA7088: ['p-root'], // e.g. the epicardium
        FMA7101: ['p-wall-1', 'p-wall-2'], // heart wall
        FMA7100: ['p-lv'], // left ventricle
      },
    })

    const [result] = resolveAvailablePresets({ compounds: [], taxonomy }, [preset('heart', 'heart')])

    expect(new Set(result.partIds)).toEqual(new Set(['p-root', 'p-wall-1', 'p-wall-2', 'p-lv']))
    expect(result.partIds).toHaveLength(4)
  })

  it('returns nothing for a concept that has no parts anywhere in its sub-tree', () => {
    const taxonomy = hierarchy({ names: { brain: 'FMA50801' } })
    expect(
      resolveAvailablePresets({ compounds: [], taxonomy }, [preset('brain', 'brain')]),
    ).toEqual([])
  })

  it('keeps the hierarchy result even when a compound also matches', () => {
    const taxonomy = hierarchy({
      names: { heart: 'FMA7088' },
      parts: { FMA7088: ['p1', 'p2'] },
    })
    const compounds = [compound('heart', 'stale-1')] // the flat file would have said otherwise

    const [result] = resolveAvailablePresets({ compounds, taxonomy }, [preset('heart', 'heart')])
    expect(result.partIds).toEqual(['p1', 'p2'])
  })
})
