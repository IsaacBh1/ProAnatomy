import { create } from 'zustand'
import { MAX_HISTORY } from '../constants/viewer'
import type { ViewSnapshot } from '../types/view'

const NO_IDS: ReadonlySet<string> = new Set()

interface ViewState {
  /** null = nothing isolated. */
  isolatedIds: ReadonlySet<string> | null
  hiddenIds: ReadonlySet<string>
  activePresetIds: readonly string[]
  history: readonly ViewSnapshot[]

  setIsolated: (ids: Iterable<string> | null) => void
  setHidden: (ids: Iterable<string>) => void
  setActivePresetIds: (ids: readonly string[]) => void
  pushHistory: (snapshot: ViewSnapshot) => void
  popHistory: () => ViewSnapshot | undefined
  reset: () => void
}

export const useViewStore = create<ViewState>()((set, get) => ({
  isolatedIds: null,
  hiddenIds: NO_IDS,
  activePresetIds: [],
  history: [],

  setIsolated: (ids) => set({ isolatedIds: ids ? new Set(ids) : null }),
  setHidden: (ids) => {
    const next = new Set(ids)
    set({ hiddenIds: next.size > 0 ? next : NO_IDS })
  },
  setActivePresetIds: (activePresetIds) => set({ activePresetIds }),
  pushHistory: (snapshot) =>
    set((s) => ({ history: [...s.history, snapshot].slice(-MAX_HISTORY) })),
  popHistory: () => {
    const top = get().history.at(-1)
    if (top) set((s) => ({ history: s.history.slice(0, -1) }))
    return top
  },
  reset: () => set({ isolatedIds: null, hiddenIds: NO_IDS, activePresetIds: [], history: [] }),
}))
