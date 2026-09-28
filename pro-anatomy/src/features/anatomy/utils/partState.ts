import { Box3, Vector3 } from 'three'
import type { SystemId } from '@/types/anatomy'
import { HIGHLIGHT } from '../constants/viewer'
import type { AnatomyPart } from '../types/model'
import type { ModelObject } from './buildModelObject'

type Entries = ModelObject['entries']

export interface PartFilters {
  visibleSystems: Record<SystemId, boolean>
  isolatedIds: ReadonlySet<string> | null
  hiddenIds: ReadonlySet<string>
  exploded: boolean
}

export function isPartVisible(part: AnatomyPart, filters: PartFilters): boolean {
  if (!filters.visibleSystems[part.system]) return false
  if (part.system === 'integumentary' && filters.exploded) return false
  if (filters.isolatedIds && !filters.isolatedIds.has(part.id)) return false
  return !filters.hiddenIds.has(part.id)
}

export function applyVisibility(entries: Entries, filters: PartFilters): void {
  for (const { part, mesh } of entries.values()) {
    const visible = isPartVisible(part, filters)
    mesh.visible = visible
    mesh.layers.set(visible ? 0 : 1)
  }
}

export function applyExplode(entries: Entries, amount: number): void {
  if (amount <= 0) {
    for (const { mesh } of entries.values()) mesh.position.set(0, 0, 0)
    return
  }

  const box = new Box3()
  for (const { part, mesh, box: partBox } of entries.values()) {
    if (mesh.visible && part.system !== 'integumentary') box.union(partBox)
  }
  if (box.isEmpty()) return

  const center = box.getCenter(new Vector3())
  for (const { mesh, center: partCenter } of entries.values()) {
    mesh.position.copy(partCenter).sub(center).multiplyScalar(amount)
  }
}

export function applyHighlight(
  entries: Entries,
  hoveredId: string | null,
  selectedIds: ReadonlySet<string>,
): void {
  for (const [id, entry] of entries) {
    const { mesh, baseMaterial } = entry
    const state = selectedIds.has(id)
      ? HIGHLIGHT.selected
      : id === hoveredId
        ? HIGHLIGHT.hovered
        : HIGHLIGHT.idle

    if (state === HIGHLIGHT.idle) {
      if (mesh.material !== baseMaterial) mesh.material = baseMaterial
      continue
    }

    let highlight = entry.highlightMaterial
    if (!highlight) {
      highlight = baseMaterial.clone()
      entry.highlightMaterial = highlight
    }
    highlight.emissive.setHex(state.color)
    highlight.emissiveIntensity = state.intensity
    if (mesh.material !== highlight) mesh.material = highlight
  }
}
