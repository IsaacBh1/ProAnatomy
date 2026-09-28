import { create } from 'zustand'
import type { CaptureFn } from '../types/snapshot'

interface CaptureState {
  capture: CaptureFn | null
  setCapture: (capture: CaptureFn | null) => void
}

export const useCaptureStore = create<CaptureState>()((set) => ({
  capture: null,
  setCapture: (capture) => set({ capture }),
}))
