import { create } from 'zustand'

interface SelectionState {
  hoveredId: string | null
  selectedIds: ReadonlySet<string>
  setHovered: (id: string | null) => void
  setSelected: (ids: Iterable<string>) => void
  reset: () => void
}

const EMPTY: ReadonlySet<string> = new Set()

export const useSelectionStore = create<SelectionState>()((set) => ({
  hoveredId: null,
  selectedIds: EMPTY,

  setHovered: (hoveredId) => set((s) => (s.hoveredId === hoveredId ? s : { hoveredId })),
  setSelected: (ids) => {
    const next = new Set(ids)
    set({ selectedIds: next.size > 0 ? next : EMPTY })
  },
  reset: () => set({ hoveredId: null, selectedIds: EMPTY }),
}))
