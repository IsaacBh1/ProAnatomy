import { create } from 'zustand'
import { SYSTEM_IDS, type Sex, type SystemId } from '@/types/anatomy'

const allSystems = (visible: boolean) =>
  Object.fromEntries(SYSTEM_IDS.map((id) => [id, visible])) as Record<SystemId, boolean>

interface AnatomyState {
  sex: Sex
  showLabels: boolean
  explode: number // 0..100
  visibleSystems: Record<SystemId, boolean>

  setSex: (sex: Sex) => void
  toggleLabels: () => void
  setExplode: (value: number) => void
  toggleSystem: (id: SystemId) => void
  setAllSystems: (visible: boolean) => void
}

export const useAnatomyStore = create<AnatomyState>()((set) => ({
  sex: 'male',
  showLabels: false,
  explode: 0,
  visibleSystems: allSystems(true),

  setSex: (sex) => set({ sex }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setExplode: (explode) => set({ explode }),
  toggleSystem: (id) =>
    set((s) => ({ visibleSystems: { ...s.visibleSystems, [id]: !s.visibleSystems[id] } })),
  setAllSystems: (visible) => set({ visibleSystems: allSystems(visible) }),
}))
