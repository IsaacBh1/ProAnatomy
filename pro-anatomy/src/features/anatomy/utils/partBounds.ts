import { Box3 } from 'three'
import type { ModelObject, PartEntry } from './buildModelObject'

type Entries = ModelObject['entries']

const displaced = ({ box, mesh }: PartEntry) => box.clone().translate(mesh.position)

export function boxOfParts(entries: Entries, ids: Iterable<string>): Box3 {
  const box = new Box3()
  for (const id of ids) {
    const entry = entries.get(id)
    if (entry) box.union(displaced(entry))
  }
  return box
}

/** Skin is excluded: it wraps everything and would always dominate the box. */
export function boxOfVisibleParts(entries: Entries): Box3 {
  const box = new Box3()
  for (const entry of entries.values()) {
    if (entry.mesh.visible && entry.part.system !== 'integumentary') box.union(displaced(entry))
  }
  return box
}
