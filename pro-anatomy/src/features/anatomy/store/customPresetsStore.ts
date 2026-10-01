import { create } from 'zustand'
import { ApiError } from '@/lib/api/errors'
import { apiRequest } from '@/lib/api/session'
import type { CustomPreset } from '../types/presets'

/**
 * Presets are user data — the API owns them. This store is a read-through cache
 * keyed to the signed-in account. It is cleared on sign-out so the sidebar
 * never shows another user's presets.
 *
 * The API assigns ids and timestamps; the UI only sends {name, partIds}.
 */

interface PresetDto {
  id: string
  name: string
  partIds: string[]
  createdAt: number
}

interface CreatePresetInput {
  name: string
  partIds: readonly string[]
}

interface CustomPresetsState {
  presets: readonly CustomPreset[]
  ready: boolean

  load: () => Promise<void>
  add: (input: CreatePresetInput) => Promise<CustomPreset | null>
  remove: (id: string) => Promise<void>
  reset: () => void
}

const toCustomPreset = (dto: PresetDto): CustomPreset => ({
  id: dto.id,
  name: dto.name,
  partIds: dto.partIds,
  createdAt: dto.createdAt,
})

export const useCustomPresetsStore = create<CustomPresetsState>()((set, get) => ({
  presets: [],
  ready: false,

  load: async () => {
    try {
      const data = await apiRequest<{ presets: PresetDto[] }>('/presets', { method: 'GET' })
      set({ presets: data.presets.map(toCustomPreset), ready: true })
    } catch {
      set({ presets: [], ready: true })
    }
  },

  add: async ({ name, partIds }) => {
    if (partIds.length === 0) return null
    try {
      const data = await apiRequest<{ preset: PresetDto }>('/presets', {
        method: 'POST',
        body: { name, partIds: [...partIds] },
      })
      const preset = toCustomPreset(data.preset)
      set({ presets: [...get().presets, preset] })
      return preset
    } catch (error) {
      // Validation failures (empty name, too many parts) and rate limiting all
      // mean "not saved" from the UI's point of view.
      if (error instanceof ApiError) return null
      throw error
    }
  },

  remove: async (id) => {
    try {
      await apiRequest<void>(`/presets/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
    set({ presets: get().presets.filter((p) => p.id !== id) })
  },

  reset: () => set({ presets: [], ready: false }),
}))
