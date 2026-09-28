import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomPreset } from '../types/presets'

const STORAGE_KEY = 'pro-anatomy:custom-presets'

interface CustomPresetsState {
  presets: readonly CustomPreset[]
  add: (preset: CustomPreset) => void
  remove: (id: string) => void
  clear: () => void
}

/**
 * User-created presets, persisted to localStorage. Deliberately separate from the model
 * query cache: presets are user data, and they survive sex switches even when their parts
 * don't exist in the other model.
 */
export const useCustomPresetsStore = create<CustomPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      add: (preset) => set((s) => ({ presets: [...s.presets, preset] })),
      remove: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
      clear: () => set({ presets: [] }),
    }),
    { name: STORAGE_KEY, version: 1 },
  ),
)

/** Local, unique-enough id. No security implication, so crypto isn't needed. */
export function createPresetId(): string {
  return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
