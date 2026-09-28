import { create } from 'zustand'

export interface ContextMenuTarget {
  partId: string
  /** Position, relative to the viewer's top-left corner. */
  x: number
  y: number
}

interface ContextMenuState {
  target: ContextMenuTarget | null
  open: (target: ContextMenuTarget) => void
  close: () => void
}

export const useContextMenuStore = create<ContextMenuState>()((set) => ({
  target: null,
  open: (target) => set({ target }),
  // No-op when already closed, so subscribers don't re-render for nothing.
  close: () => set((s) => (s.target === null ? s : { target: null })),
}))
