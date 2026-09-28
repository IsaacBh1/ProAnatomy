import { create } from 'zustand'
import type { CameraApi } from '../types/camera'

interface CameraState {
  api: CameraApi | null
  setApi: (api: CameraApi | null) => void
}

/** The Canvas registers its camera here, so code outside it (toolbar, shortcuts) can drive it. */
export const useCameraStore = create<CameraState>()((set) => ({
  api: null,
  setApi: (api) => set({ api }),
}))
