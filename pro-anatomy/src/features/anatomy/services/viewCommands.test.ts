import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useCameraStore } from '../store/cameraStore'
import { useViewStore } from '../store/viewStore'
import type { AvailablePreset } from '../types'
import type { CameraApi } from '../types/camera'
import {
  clearSelection,
  exitIsolation,
  goBack,
  hideParts,
  hideSelection,
  isolatePart,
  isolateSelection,
  restoreAll,
  selectPart,
  toggleIsolate,
  togglePreset,
  toggleSystemVisibility,
} from './viewCommands'

const POSE = { position: [0, 0, 5], target: [0, 0, 0] } as const

const makeCamera = (): CameraApi => ({
  getPose: () => POSE,
  animateTo: vi.fn(),
  focusOnParts: vi.fn(),
  frameVisible: vi.fn(),
  recenterOnVisible: vi.fn(),
  zoomBy: vi.fn(),
  resetView: vi.fn(),
  setStandardView: vi.fn(),
})

let camera: CameraApi

beforeEach(() => {
  camera = makeCamera()
  useCameraStore.getState().setApi(camera)
  useSelectionStore.getState().reset()
  useViewStore.getState().reset()
  useAnatomyStore.getState().setAllSystems(true)
})


describe('selectPart', () => {
  it('replaces the selection by default', () => {
    useSelectionStore.getState().setSelected(['a'])
    selectPart('b', false)
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['b']))
  })

  it('toggles with additive', () => {
    useSelectionStore.getState().setSelected(['a'])
    selectPart('b', true)
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['a', 'b']))
    selectPart('a', true)
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['b']))
  })

  it('is a no-op when the same part is already the only selection', () => {
    useSelectionStore.getState().setSelected(['a'])
    selectPart('a', false)
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})

describe('clearSelection', () => {
  it('empties the selection and pushes history', () => {
    useSelectionStore.getState().setSelected(['a', 'b'])
    clearSelection()
    expect(useSelectionStore.getState().selectedIds.size).toBe(0)
    expect(useViewStore.getState().history).toHaveLength(1)
  })

  it('does nothing without a selection', () => {
    clearSelection()
    expect(useViewStore.getState().history).toHaveLength(0)
  })

  it('is undone by Back', () => {
    useSelectionStore.getState().setSelected(['a'])
    clearSelection()
    goBack()
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['a']))
  })
})


describe('hideParts', () => {
  it('hides and deselects in one step', () => {
    useSelectionStore.getState().setSelected(['a', 'b'])
    hideParts(['a'])
    expect(useViewStore.getState().hiddenIds).toEqual(new Set(['a']))
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['b']))
    expect(camera.recenterOnVisible).toHaveBeenCalled()
  })

  it('does nothing for an empty set', () => {
    hideParts([])
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})

describe('hideSelection', () => {
  it('hides the current selection and Back restores both', () => {
    useSelectionStore.getState().setSelected(['a', 'b'])
    hideSelection()
    expect(useViewStore.getState().hiddenIds).toEqual(new Set(['a', 'b']))
    expect(useSelectionStore.getState().selectedIds.size).toBe(0)

    goBack()
    expect(useViewStore.getState().hiddenIds.size).toBe(0)
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['a', 'b']))
    expect(camera.animateTo).toHaveBeenCalledWith(POSE)
  })
})

describe('restoreAll', () => {
  it('clears hidden and recenters', () => {
    useViewStore.getState().setHidden(['a', 'b'])
    restoreAll()
    expect(useViewStore.getState().hiddenIds.size).toBe(0)
    expect(camera.recenterOnVisible).toHaveBeenCalled()
  })

  it('is a no-op when nothing is hidden', () => {
    restoreAll()
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})


describe('isolatePart', () => {
  it('isolates just the part when it is not in the selection', () => {
    useSelectionStore.getState().setSelected(['a'])
    isolatePart('b')
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['b']))
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['b']))
  })

  it('isolates the whole selection when the part is in it', () => {
    useSelectionStore.getState().setSelected(['a', 'b'])
    isolatePart('a')
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['a', 'b']))
  })

  it('clears any active presets', () => {
    useViewStore.getState().setActivePresetIds(['heart'])
    isolatePart('a')
    expect(useViewStore.getState().activePresetIds).toEqual([])
  })
})

describe('isolateSelection', () => {
  it('isolates and focuses the selection', () => {
    useSelectionStore.getState().setSelected(['a'])
    isolateSelection()
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['a']))
    expect(camera.focusOnParts).toHaveBeenCalledWith(new Set(['a']))
  })

  it('does nothing without a selection', () => {
    isolateSelection()
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})

describe('exitIsolation', () => {
  it('drops isolation and reframes the camera', () => {
    useViewStore.getState().setIsolated(['a'])
    exitIsolation()
    expect(useViewStore.getState().isolatedIds).toBeNull()
    expect(camera.frameVisible).toHaveBeenCalled()
  })

  it('is a no-op without isolation', () => {
    exitIsolation()
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})

describe('toggleIsolate', () => {
  it('isolates on the first call and exits on the second', () => {
    useSelectionStore.getState().setSelected(['a'])
    toggleIsolate()
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['a']))
    toggleIsolate()
    expect(useViewStore.getState().isolatedIds).toBeNull()
  })
})


describe('togglePreset', () => {
  const available: AvailablePreset[] = [
    { preset: { id: 'heart', label: 'Heart', matchNames: ['heart'] }, partIds: ['h1', 'h2'] },
    { preset: { id: 'liver', label: 'Liver', matchNames: ['liver'] }, partIds: ['l1'] },
  ]

  it('isolates the union of checked presets and lifts the isolation when none remain', () => {
    togglePreset('heart', available)
    togglePreset('liver', available)
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['h1', 'h2', 'l1']))

    togglePreset('heart', available)
    togglePreset('liver', available)
    expect(useViewStore.getState().isolatedIds).toBeNull()
    expect(useViewStore.getState().activePresetIds).toEqual([])
  })

  it('clears the selection on every toggle', () => {
    useSelectionStore.getState().setSelected(['x'])
    togglePreset('heart', available)
    expect(useSelectionStore.getState().selectedIds.size).toBe(0)
  })
})


describe('toggleSystemVisibility', () => {
  it('turns the system on and frames its parts', () => {
    useAnatomyStore.getState().toggleSystem('cardiac') // off
    toggleSystemVisibility('cardiac', [
      { id: 'h1', name: 'Heart', system: 'cardiac', geometry: undefined as never },
      { id: 'l1', name: 'Liver', system: 'digestive', geometry: undefined as never },
    ])
    expect(useAnatomyStore.getState().visibleSystems.cardiac).toBe(true)
    expect(camera.focusOnParts).toHaveBeenCalledWith(new Set(['h1']))
  })

  it('does not frame when turning a system off', () => {
    toggleSystemVisibility('cardiac', [])
    expect(camera.focusOnParts).not.toHaveBeenCalled()
  })

  it('is not pushed to history', () => {
    toggleSystemVisibility('cardiac', [])
    expect(useViewStore.getState().history).toHaveLength(0)
  })
})
