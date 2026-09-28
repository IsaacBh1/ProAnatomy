import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import type { SystemId } from '@/types/anatomy'
import { EXPLODE_HIDES_SKIN_ABOVE } from '../constants/viewer'
import { useViewStore } from '../store/viewStore'
import type { ModelObject } from '../utils/buildModelObject'
import { applyExplode, applyHighlight, applyVisibility } from '../utils/partState'

interface PartState {
  visibleSystems: Record<SystemId, boolean>
  isolatedIds: ReadonlySet<string> | null
  hiddenIds: ReadonlySet<string>
  explode: number
}

const readPartState = (): PartState => {
  const { visibleSystems, explode } = useAnatomyStore.getState()
  const { isolatedIds, hiddenIds } = useViewStore.getState()
  return { visibleSystems, isolatedIds, hiddenIds, explode }
}

const partStateChanged = (a: PartState, b: PartState) =>
  a.visibleSystems !== b.visibleSystems ||
  a.isolatedIds !== b.isolatedIds ||
  a.hiddenIds !== b.hiddenIds ||
  a.explode !== b.explode

export function useSceneSync(entries: ModelObject['entries']): void {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let parts = readPartState()
    let highlight = {
      hoveredId: useSelectionStore.getState().hoveredId,
      selectedIds: useSelectionStore.getState().selectedIds,
    }

    const syncParts = () => {
      applyVisibility(entries, {
        visibleSystems: parts.visibleSystems,
        isolatedIds: parts.isolatedIds,
        hiddenIds: parts.hiddenIds,
        exploded: parts.explode > EXPLODE_HIDES_SKIN_ABOVE,
      })
      applyExplode(entries, parts.explode / 100)
      invalidate()
    }

    const syncHighlight = () => {
      applyHighlight(entries, highlight.hoveredId, highlight.selectedIds)
      invalidate()
    }

    const onPartsMaybeChanged = () => {
      const next = readPartState()
      if (!partStateChanged(parts, next)) return
      parts = next
      syncParts()
    }

    const onSelectionMaybeChanged = () => {
      const { hoveredId, selectedIds } = useSelectionStore.getState()
      if (hoveredId === highlight.hoveredId && selectedIds === highlight.selectedIds) return
      highlight = { hoveredId, selectedIds }
      syncHighlight()
    }

    syncParts()
    syncHighlight()

    const unsubscribe = [
      useAnatomyStore.subscribe(onPartsMaybeChanged),
      useViewStore.subscribe(onPartsMaybeChanged),
      useSelectionStore.subscribe(onSelectionMaybeChanged),
    ]
    return () => unsubscribe.forEach((off) => off())
  }, [entries, invalidate])
}
