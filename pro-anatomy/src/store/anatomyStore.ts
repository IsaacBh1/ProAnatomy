import { create } from 'zustand'
import { SYSTEM_IDS, type Sex, type SystemId } from '@/types/anatomy'
import { MAX_LAYER_DEPTH } from '@/features/anatomy/constants/layers'

const allSystems = (visible: boolean) =>
  Object.fromEntries(SYSTEM_IDS.map((id) => [id, visible])) as Record<SystemId, boolean>

interface AnatomyState {
  sex: Sex
  showLabels: boolean
  explode: number // 0..100
  visibleSystems: Record<SystemId, boolean>
  /**
   * How many outermost shells the layer slider has peeled away.
   *   0 → nothing peeled (everything drawn)
   *   MAX → only the innermost shell remains
   *
   * Default is 1: skin is peeled, matching the pre-slider look (skin was already
   * rendered at ~8% opacity, so hiding it entirely is visually equivalent).
   */
  layerDepth: number

  setSex: (sex: Sex) => void
  toggleLabels: () => void
  setExplode: (value: number) => void
  toggleSystem: (id: SystemId) => void
  setAllSystems: (visible: boolean) => void
  setLayerDepth: (depth: number) => void
}

const clampDepth = (n: number) => Math.max(0, Math.min(MAX_LAYER_DEPTH, Math.round(n)))

export const useAnatomyStore = create<AnatomyState>()((set) => ({
  sex: 'male',
  showLabels: false,
  explode: 0,
  visibleSystems: allSystems(true),
  layerDepth: 1,

  setSex: (sex) => set({ sex }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setExplode: (explode) => set({ explode }),
  toggleSystem: (id) =>
    set((s) => ({ visibleSystems: { ...s.visibleSystems, [id]: !s.visibleSystems[id] } })),
  setAllSystems: (visible) => set({ visibleSystems: allSystems(visible) }),
  setLayerDepth: (depth) => set({ layerDepth: clampDepth(depth) }),
}))
