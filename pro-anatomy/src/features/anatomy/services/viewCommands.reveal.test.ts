import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useCameraStore } from '../store/cameraStore'
import { useViewStore } from '../store/viewStore'
import type { CameraApi } from '../types/camera'
import { goBack, revealPart } from './viewCommands'

const makeCamera = (): CameraApi => ({
  getPose: () => ({ position: [0, 0, 5], target: [0, 0, 0] }),
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

describe('revealPart', () => {
  it('un-hides the part, turns its system back on, then selects and isolates it', () => {
    useAnatomyStore.getState().toggleSystem('cardiac')
    useViewStore.getState().setHidden(['heart', 'liver'])

    revealPart('heart', 'cardiac')

    expect(useAnatomyStore.getState().visibleSystems.cardiac).toBe(true)
    expect(useViewStore.getState().hiddenIds).toEqual(new Set(['liver']))
    expect(useViewStore.getState().isolatedIds).toEqual(new Set(['heart']))
    expect(useSelectionStore.getState().selectedIds).toEqual(new Set(['heart']))
    expect(camera.focusOnParts).toHaveBeenCalledWith(new Set(['heart']))
  })

  it('is undone by Back', () => {
    useViewStore.getState().setHidden(['heart', 'liver'])

    revealPart('heart', 'cardiac')
    goBack()

    expect(useViewStore.getState().isolatedIds).toBeNull()
    expect(useViewStore.getState().hiddenIds).toEqual(new Set(['heart', 'liver']))
  })
})
