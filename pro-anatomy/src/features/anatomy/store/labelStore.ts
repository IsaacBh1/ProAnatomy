import { create } from 'zustand'
import type { LabelItem } from '../types/labels'
import { sameLabels } from '../utils/labelLayout'

interface LabelState {
  items: readonly LabelItem[]
  setItems: (items: readonly LabelItem[]) => void
  clear: () => void
}

const NONE: readonly LabelItem[] = []

/** Written by the Canvas every rendered frame, read by the SVG overlay and the snapshot. */
export const useLabelStore = create<LabelState>()((set) => ({
  items: NONE,
  // Returning the same state object means "no change": subscribers are not notified.
  setItems: (items) => set((s) => (sameLabels(s.items, items) ? s : { items })),
  clear: () => set((s) => (s.items.length === 0 ? s : { items: NONE })),
}))
