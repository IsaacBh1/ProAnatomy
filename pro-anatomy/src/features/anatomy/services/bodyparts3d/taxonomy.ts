/**
 * BodyParts3D concept hierarchy.
 *
 * Three files feed this:
 *   isa_parts_list_e.json              concept id → name
 *   isa_inclusion_relation_list.json   concept id → child concept ids ("is-a" edges)
 *   bodyparts3d_isa_element_parts.json concept id → mesh part ids
 *
 * The dataset is delivered in several shapes depending on the release; `buildTaxonomy` accepts
 * the plausible ones and normalises to a single structure. If the loader finds nothing usable,
 * it logs the shape it saw so the adapter can be extended.
 */

export interface PartTaxonomy {
  /** Lower-cased, trimmed concept name → concept id. First wins on collision. */
  conceptByName: ReadonlyMap<string, string>
  /** Concept id → direct child concept ids. */
  childrenOf: ReadonlyMap<string, readonly string[]>
  /** Concept id → mesh part ids registered directly on that concept. */
  partsOf: ReadonlyMap<string, readonly string[]>
}

export const EMPTY_TAXONOMY: PartTaxonomy = {
  conceptByName: new Map(),
  childrenOf: new Map(),
  partsOf: new Map(),
}

/** Normalises a name for lookup: trim, collapse whitespace, lowercase. */
export const normalizeConceptName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').toLowerCase()

interface TaxonomyInputs {
  /** isa_parts_list_e.json content. */
  names: unknown
  /** isa_inclusion_relation_list.json content. */
  isa: unknown
  /** bodyparts3d_isa_element_parts.json content. */
  elementParts: unknown
}

type RawName = { id: string; name: string }

/** Accepts: {id: "name"}, {id: {name, ...}}, [{id, name}], [[id, name]]. */
function readNames(input: unknown): RawName[] {
  const out: RawName[] = []

  const push = (id: unknown, name: unknown) => {
    if (typeof id !== 'string' || typeof name !== 'string') return
    out.push({ id, name })
  }

  if (Array.isArray(input)) {
    for (const row of input) {
      if (Array.isArray(row) && row.length >= 2) push(row[0], row[1])
      else if (row && typeof row === 'object') {
        const r = row as Record<string, unknown>
        push(r.id ?? r.ID ?? r.fmaId, r.name ?? r.Name ?? r.label)
      }
    }
    return out
  }

  if (input && typeof input === 'object') {
    for (const [id, value] of Object.entries(input as Record<string, unknown>)) {
      if (typeof value === 'string') push(id, value)
      else if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>
        push(id, v.name ?? v.Name ?? v.label ?? v.english)
      }
    }
  }
  return out
}

/** Accepts: {parent: [child, ...]}, {parent: child}, [[parent, child]], [{parent, child}], nested tree. */
function readEdges(input: unknown): Array<[string, string]> {
  const out: Array<[string, string]> = []

  const pushPair = (parent: unknown, child: unknown) => {
    if (typeof parent === 'string' && typeof child === 'string') out.push([parent, child])
  }

  const walkTree = (node: unknown, parentId: string | null) => {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    const id = typeof n.id === 'string' ? n.id : parentId
    if (parentId && id) pushPair(parentId, id)
    const children = n.children ?? n.isa ?? n.child
    if (Array.isArray(children)) for (const child of children) walkTree(child, id ?? null)
  }

  if (Array.isArray(input)) {
    for (const row of input) {
      if (Array.isArray(row) && row.length >= 2) pushPair(row[0], row[1])
      else if (row && typeof row === 'object') {
        const r = row as Record<string, unknown>
        if ('children' in r || 'isa' in r) walkTree(r, null)
        else pushPair(r.parent ?? r.from ?? r.source, r.child ?? r.to ?? r.target)
      }
    }
    return out
  }

  if (input && typeof input === 'object') {
    for (const [parent, value] of Object.entries(input as Record<string, unknown>)) {
      if (typeof value === 'string') pushPair(parent, value)
      else if (Array.isArray(value)) {
        for (const child of value) {
          if (typeof child === 'string') pushPair(parent, child)
          else if (child && typeof child === 'object') {
            const c = child as Record<string, unknown>
            pushPair(parent, c.id ?? c.ID ?? c.child)
          }
        }
      }
    }
  }
  return out
}

/** Accepts: {conceptId: [partId, ...]}, {conceptId: partId}, [{conceptId, parts: [...]}]. */
function readElementParts(input: unknown): Array<[string, string[]]> {
  const out: Array<[string, string[]]> = []

  const pushList = (conceptId: unknown, parts: unknown) => {
    if (typeof conceptId !== 'string') return
    if (typeof parts === 'string') return out.push([conceptId, [parts]])
    if (Array.isArray(parts)) {
      const ids = parts.filter((p): p is string => typeof p === 'string')
      if (ids.length > 0) out.push([conceptId, ids])
    }
  }

  if (Array.isArray(input)) {
    for (const row of input) {
      if (Array.isArray(row) && row.length >= 2) pushList(row[0], row[1])
      else if (row && typeof row === 'object') {
        const r = row as Record<string, unknown>
        pushList(r.conceptId ?? r.id ?? r.fmaId, r.parts ?? r.elementParts ?? r.children)
      }
    }
    return out
  }

  if (input && typeof input === 'object') {
    for (const [conceptId, value] of Object.entries(input as Record<string, unknown>)) {
      pushList(conceptId, value)
    }
  }
  return out
}

export function buildTaxonomy({ names, isa, elementParts }: TaxonomyInputs): PartTaxonomy {
  const conceptByName = new Map<string, string>()
  for (const { id, name } of readNames(names)) {
    const key = normalizeConceptName(name)
    if (key && !conceptByName.has(key)) conceptByName.set(key, id)
  }

  const childrenOf = new Map<string, string[]>()
  for (const [parent, child] of readEdges(isa)) {
    const list = childrenOf.get(parent)
    if (list) list.push(child)
    else childrenOf.set(parent, [child])
  }

  const partsOf = new Map<string, readonly string[]>()
  for (const [conceptId, ids] of readElementParts(elementParts)) {
    const existing = partsOf.get(conceptId)
    partsOf.set(conceptId, existing ? [...existing, ...ids] : ids)
  }

  return { conceptByName, childrenOf, partsOf }
}

/**
 * Every mesh part id reachable from `conceptId` through the isa tree, including the concept's
 * own direct parts. Cycles and diamonds are handled; depth is bounded defensively.
 */
export function partsUnder(
  taxonomy: PartTaxonomy,
  conceptId: string,
  maxDepth = 32,
): Set<string> {
  const parts = new Set<string>()
  const visited = new Set<string>()
  const queue: Array<{ id: string; depth: number }> = [{ id: conceptId, depth: 0 }]

  while (queue.length > 0) {
    const { id, depth } = queue.pop()!
    if (visited.has(id) || depth > maxDepth) continue
    visited.add(id)

    for (const partId of taxonomy.partsOf.get(id) ?? []) parts.add(partId)
    for (const child of taxonomy.childrenOf.get(id) ?? []) {
      if (!visited.has(child)) queue.push({ id: child, depth: depth + 1 })
    }
  }
  return parts
}

/** Diagnostics for the loader: how much actually came through. */
export function describeTaxonomy(taxonomy: PartTaxonomy): string {
  const concepts = taxonomy.conceptByName.size
  const edges = [...taxonomy.childrenOf.values()].reduce((n, list) => n + list.length, 0)
  const mapped = taxonomy.partsOf.size
  const parts = [...taxonomy.partsOf.values()].reduce((n, list) => n + list.length, 0)
  return `concepts=${concepts} isa-edges=${edges} concepts-with-parts=${mapped} direct-parts=${parts}`
}
