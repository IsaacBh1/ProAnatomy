import { partsUnder, type PartTaxonomy } from '../services/bodyparts3d/taxonomy'
import type { AvailablePreset, OrganPreset } from '../types'
import type { CompoundOrgan } from '../types/model'

/**
 * Resolves each preset against the BodyParts3D hierarchy.
 *
 * The preset's `matchNames` are looked up in order; the first hit is taken as the root concept,
 * and **every part reachable from that concept** is included, not just the parts attached to
 * the root node. This is what makes "heart" return all four chambers, the valves, the septum,
 * and everything else BodyParts3D nests under the heart concept.
 *
 * When no taxonomy is available (e.g. the female GLB model), it falls back to the old flat
 * compound-name match, so the feature degrades rather than disappears.
 */
export function resolveAvailablePresets(
  model: { compounds: readonly CompoundOrgan[]; taxonomy: PartTaxonomy },
  presets: readonly OrganPreset[],
): AvailablePreset[] {
  const { compounds, taxonomy } = model
  const compoundIndex = indexCompoundsByName(compounds)

  return presets.flatMap((preset) => {
    const partIds = lookupPreset(preset, taxonomy, compoundIndex, compounds)
    return partIds.size > 0 ? [{ preset, partIds: [...partIds] }] : []
  })
}

function lookupPreset(
  preset: OrganPreset,
  taxonomy: PartTaxonomy,
  compoundIndex: ReadonlyMap<string, CompoundOrgan>,
  compounds: readonly CompoundOrgan[],
): Set<string> {
  // 1. Hierarchy exact match: find the concept, then everything under it.
  for (const name of preset.matchNames) {
    const conceptId = taxonomy.conceptByName.get(name.trim().toLowerCase())
    if (!conceptId) continue
    const parts = partsUnder(taxonomy, conceptId)
    if (parts.size > 0) return parts
  }

  // 2. Hierarchy prefix fallback: "heart" → "heart wall" and friends.
  for (const name of preset.matchNames) {
    const prefix = `${name.trim().toLowerCase()} `
    for (const [key, conceptId] of taxonomy.conceptByName) {
      if (!key.startsWith(prefix)) continue
      const parts = partsUnder(taxonomy, conceptId)
      if (parts.size > 0) return parts
    }
  }

  // 3. Flat compound exact match (smallest wins, see indexCompoundsByName).
  for (const name of preset.matchNames) {
    const compound = compoundIndex.get(name.trim().toLowerCase())
    if (compound) return new Set(compound.partIds)
  }

  // 4. Flat compound prefix fallback: same idea as step 2, against the compound list.
  //    This is what the female GLB model relies on, since it has no hierarchy files.
  for (const name of preset.matchNames) {
    const prefix = `${name.trim().toLowerCase()} `
    for (const compound of compounds) {
      if (compound.name.trim().toLowerCase().startsWith(prefix)) {
        return new Set(compound.partIds)
      }
    }
  }

  return new Set()
}

/** When several compounds share a name, the smallest (most specific) one wins. */
function indexCompoundsByName(compounds: readonly CompoundOrgan[]): Map<string, CompoundOrgan> {
  const index = new Map<string, CompoundOrgan>()
  for (const compound of compounds) {
    const key = compound.name.trim().toLowerCase()
    const previous = index.get(key)
    if (!previous || previous.partIds.length > compound.partIds.length) index.set(key, compound)
  }
  return index
}
