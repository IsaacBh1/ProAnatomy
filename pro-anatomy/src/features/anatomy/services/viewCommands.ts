import { useAnatomyStore } from '@/store/anatomyStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import type { SystemId } from '@/types/anatomy'
import { EXPLODE_DEFAULT_ON, EXPLODE_HIDES_SKIN_ABOVE } from '../constants/viewer'
import { useCameraStore } from '../store/cameraStore'
import { useCaptureStore } from '../store/captureStore'
import { useViewStore } from '../store/viewStore'
import type { AvailablePreset } from '../types'
import type { ViewSnapshot } from '../types/view'
import { snapshotsEqual } from '../utils/viewSnapshot'
import type { AnatomyPart } from '../types/model'

const selection = () => useSelectionStore.getState()
const view = () => useViewStore.getState()
const camera = () => useCameraStore.getState().api


function takeSnapshot(): ViewSnapshot {
  const { isolatedIds, hiddenIds, activePresetIds } = view()
  return {
    selectedIds: [...selection().selectedIds],
    isolatedIds: isolatedIds ? [...isolatedIds] : null,
    hiddenIds: [...hiddenIds],
    activePresetIds,
    pose: camera()?.getPose() ?? null,
  }
}

/** Call before every change the user should be able to undo. */
function remember(): void {
  const snapshot = takeSnapshot()
  const top = view().history.at(-1)
  if (top && snapshotsEqual(top, snapshot)) return
  view().pushHistory(snapshot)
}

export function goBack(): void {
  const snapshot = view().popHistory()
  if (!snapshot) return

  selection().setSelected(snapshot.selectedIds)
  view().setIsolated(snapshot.isolatedIds)
  view().setHidden(snapshot.hiddenIds)
  view().setActivePresetIds(snapshot.activePresetIds)
  if (snapshot.pose) camera()?.animateTo(snapshot.pose)
}


export function clearSelection(): void {
  if (selection().selectedIds.size === 0) return
  remember()
  selection().setSelected([])
}

export function selectPart(id: string, additive: boolean): void {
  const current = selection().selectedIds

  if (additive) {
    const next = new Set(current)
    if (!next.delete(id)) next.add(id)
    remember()
    selection().setSelected(next)
    return
  }

  if (current.size === 1 && current.has(id)) return
  remember()
  selection().setSelected([id])
}

export function selectMany(ids: ReadonlySet<string>, additive: boolean): void {
  if (ids.size === 0) {
    if (!additive) clearSelection()
    return
  }
  remember()
  selection().setSelected(additive ? [...selection().selectedIds, ...ids] : ids)
}


function isolate(ids: ReadonlySet<string>): void {
  view().setIsolated(ids)
  view().setActivePresetIds([])
  camera()?.focusOnParts(ids)
}

/** Double-click: isolates the whole selection if the part is in it, else just the part. */
export function isolatePart(id: string): void {
  const current = selection().selectedIds
  const ids = current.has(id) ? current : new Set([id])
  remember()
  selection().setSelected(ids)
  isolate(ids)
}

export function isolateSelection(): void {
  const ids = selection().selectedIds
  if (ids.size === 0) return
  remember()
  isolate(ids)
}

/**
 * Search result: makes sure the part can be seen (un-hides it, turns its system back on),
 * then selects and isolates it. Back undoes the selection, isolation and hiding, but not the
 * system checkbox (system toggles are not part of the history).
 */
export function revealPart(id: string, system: SystemId): void {
  remember()

  const { visibleSystems, toggleSystem } = useAnatomyStore.getState()
  if (!visibleSystems[system]) toggleSystem(system)

  const { hiddenIds, setHidden } = view()
  if (hiddenIds.has(id)) setHidden([...hiddenIds].filter((hidden) => hidden !== id))

  selection().setSelected([id])
  isolate(new Set([id]))
}

export function exitIsolation(): void {
  if (!view().isolatedIds) return
  remember()
  view().setIsolated(null)
  view().setActivePresetIds([])
  camera()?.frameVisible()
}

export function toggleIsolate(): void {
  if (view().isolatedIds) exitIsolation()
  else isolateSelection()
}


export function hideParts(ids: Iterable<string>): void {
  const toHide = new Set(ids)
  if (toHide.size === 0) return

  remember()
  view().setHidden([...view().hiddenIds, ...toHide])
  selection().setSelected([...selection().selectedIds].filter((id) => !toHide.has(id)))
  camera()?.recenterOnVisible()
}

export function hideSelection(): void {
  hideParts(selection().selectedIds)
}

export function restoreAll(): void {
  if (view().hiddenIds.size === 0) return
  remember()
  view().setHidden([])
  camera()?.recenterOnVisible()
}


/** Checked presets = isolation of their union. No checked presets = nothing isolated. */
export function togglePreset(id: string, available: readonly AvailablePreset[]): void {
  const current = view().activePresetIds
  const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id]

  const partIds = new Set<string>()
  for (const { preset, partIds: ids } of available) {
    if (next.includes(preset.id)) for (const partId of ids) partIds.add(partId)
  }

  remember()
  view().setActivePresetIds(next)
  view().setIsolated(next.length > 0 ? partIds : null)
  selection().setSelected([])
  if (partIds.size > 0) camera()?.focusOnParts(partIds)
}


export function toggleExplode(): void {
  const { explode, setExplode } = useAnatomyStore.getState()
  setExplode(explode > EXPLODE_HIDES_SKIN_ABOVE ? 0 : EXPLODE_DEFAULT_ON)
}

export function toggleLabels(): void {
  useAnatomyStore.getState().toggleLabels()
}

/** Only opens once the 3D view has registered its renderer (i.e. a model is loaded). */
export function openSnapshot(): void {
  if (useCaptureStore.getState().capture) useUiStore.getState().setSnapshotOpen(true)
}


/**
 * Toggles a system's visibility, and when it is being turned ON, frames the camera on that
 * system's parts. Not pushed to history: system toggles are documented as outside undo.
 */
export function toggleSystemVisibility(id: SystemId, parts: readonly AnatomyPart[]): void {
  const { visibleSystems, toggleSystem } = useAnatomyStore.getState()
  const turningOn = !visibleSystems[id]
  toggleSystem(id)

  if (!turningOn) return

  const ids = new Set<string>()
  for (const part of parts) if (part.system === id) ids.add(part.id)
  if (ids.size > 0) camera()?.focusOnParts(ids)
}

// ------------------------------------------------------------------- camera

/**
 * Moves the camera to frame one part. No history: it is not an undoable view change, it just
 * re-frames what is already on screen.
 */
export function focusOnPart(id: string): void {
  camera()?.focusOnParts(new Set([id]))
}

/** Frames a specific set of parts without changing selection or isolation. Used by notes. */
export function revealParts(ids: ReadonlySet<string>): void {
  if (ids.size === 0) return
  camera()?.focusOnParts(ids)
}
