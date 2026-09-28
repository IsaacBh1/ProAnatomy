import { create } from 'zustand'
import type { BandRect } from '../types/view'

interface BandState {
  rect: BandRect | null
  setRect: (rect: BandRect | null) => void
}

export const useBandStore = create<BandState>()((set) => ({
  rect: null,
  setRect: (rect) => set({ rect }),
}))
