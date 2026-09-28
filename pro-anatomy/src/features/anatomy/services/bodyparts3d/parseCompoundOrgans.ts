import type { CompoundOrgan } from '../../types/model'

interface ElementPartRow {
  conceptId: string
  name: string
  elementId: string
}

const text = (value: unknown): string => (value == null ? '' : String(value).trim())

const row = (conceptId: string, name: string, elementId: string): ElementPartRow | null =>
  conceptId && name && elementId ? { conceptId, name, elementId } : null

/** The ToGoDB export ships as row arrays or as objects with a few key spellings. */
function toRow(raw: unknown): ElementPartRow | null {
  if (Array.isArray(raw)) return row(text(raw[0]), text(raw[1]), text(raw[2]))
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    return row(
      text(r.concept_id ?? r.conceptId ?? r['concept id']),
      text(r.name ?? r.Name),
      text(r.element_file_id ?? r.elementFileId ?? r['element file id'] ?? r.element_id),
    )
  }
  return null
}

/**
 * Merges element-part files into compound organs.
 * Later sources win name conflicts. Parts not present in the atlas are dropped.
 */
export function buildCompoundOrgans(
  sources: readonly unknown[],
  knownPartIds: ReadonlySet<string>,
): CompoundOrgan[] {
  const byConcept = new Map<string, { id: string; name: string; partIds: Set<string> }>()

  for (const source of sources) {
    if (!Array.isArray(source)) continue
    for (const raw of source) {
      const parsed = toRow(raw)
      if (!parsed || !knownPartIds.has(parsed.elementId)) continue

      const entry = byConcept.get(parsed.conceptId) ?? {
        id: parsed.conceptId,
        name: parsed.name,
        partIds: new Set<string>(),
      }
      entry.name = parsed.name
      entry.partIds.add(parsed.elementId)
      byConcept.set(parsed.conceptId, entry)
    }
  }

  return [...byConcept.values()].map(({ id, name, partIds }) => ({
    id,
    name,
    partIds: [...partIds],
  }))
}
