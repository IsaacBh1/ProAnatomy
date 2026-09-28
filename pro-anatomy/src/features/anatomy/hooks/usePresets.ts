import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAnatomyStore } from '@/store/anatomyStore'
import { ORGAN_PRESETS } from '../constants/organPresets'
import { togglePreset } from '../services/viewCommands'
import { useCustomPresetsStore } from '../store/customPresetsStore'
import { useViewStore } from '../store/viewStore'
import type { AvailablePreset } from '../types'
import type { AnatomyModel } from '../types/model'
import { resolveAvailablePresets } from '../utils/resolvePresets'
import { anatomyModelQuery, useAnatomyModel } from './useAnatomyModel'

const NONE: readonly AvailablePreset[] = []

// Module-level, so `select` keeps a stable identity between renders.
const selectAvailablePresets = (model: AnatomyModel) =>
  resolveAvailablePresets(model, ORGAN_PRESETS)

export function usePresets() {
  const sex = useAnatomyStore((state) => state.sex)
  const { data: builtIn = NONE } = useQuery({
    ...anatomyModelQuery(sex),
    select: selectAvailablePresets,
  })
  const { data: model } = useAnatomyModel(sex)
  const stored = useCustomPresetsStore((state) => state.presets)

  // Custom presets store raw part ids. Keep only ids that exist in the loaded model, so a
  // preset made for one body degrades to nothing (rather than breaking) on the other.
  const custom = useMemo<readonly AvailablePreset[]>(() => {
    if (!model) return NONE
    const known = new Set(model.parts.map((part) => part.id))
    return stored.flatMap(({ id, name, partIds }) => {
      const live = partIds.filter((partId) => known.has(partId))
      return live.length > 0
        ? [{ preset: { id, label: name, matchNames: [] }, partIds: live }]
        : []
    })
  }, [model, stored])

  const customIds = useMemo(() => new Set(custom.map(({ preset }) => preset.id)), [custom])
  const available = useMemo(() => [...builtIn, ...custom], [builtIn, custom])

  const activeIds = useViewStore((state) => state.activePresetIds)
  const toggle = useCallback((id: string) => togglePreset(id, available), [available])

  const remove = useCallback(
    (id: string) => {
      // Uncheck first: togglePreset knows how to re-derive isolation without this preset.
      if (useViewStore.getState().activePresetIds.includes(id)) togglePreset(id, available)
      useCustomPresetsStore.getState().remove(id)
    },
    [available],
  )

  return { available, customIds, activeIds, toggle, remove }
}
