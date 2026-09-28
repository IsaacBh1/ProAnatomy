// src/features/anatomy/hooks/useViewerShortcuts.ts
import { useEffect } from 'react'
import { addNoteForSelection } from '@/features/notes/services/noteCommands'
import { useNotesUiStore } from '@/features/notes/store/notesUiStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import {
  clearSelection,
  goBack,
  hideSelection,
  isolateSelection,
  openSnapshot,
  restoreAll,
  toggleExplode,
  toggleLabels,
} from '../services/viewCommands'
import { useCameraStore } from '../store/cameraStore'
import { usePresetDraftStore } from '../store/presetDraftStore'
import type { StandardView } from '../types/camera'

const ZOOM_IN_FACTOR = 0.85
const ZOOM_OUT_FACTOR = 1.18

interface ShortcutRule {
  id: string
  keys: readonly string[]
  modifier?: boolean
  shift?: boolean
  notOnButton?: boolean
  preventDefault?: boolean
  run: () => void
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const isOnButton = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('button, a, [role="button"]') !== null

const tool = (id: 'orbit' | 'zoom' | 'select' | 'pan') => () =>
  useUiStore.getState().setActiveTool(id)

const view = (id: StandardView) => () =>
  useCameraStore.getState().api?.setStandardView(id)

const camera = () => useCameraStore.getState().api

function cancelDraftOrClearSelection(): void {
  const draft = usePresetDraftStore.getState()
  if (draft.collecting) {
    draft.reset()
    return
  }
  clearSelection()
}

function isolateIfAnySelected(): void {
  if (useSelectionStore.getState().selectedIds.size > 0) isolateSelection()
}

function toggleCallout(): void {
  const ui = useUiStore.getState()
  const { selectedIds, hoveredId } = useSelectionStore.getState()
  if (selectedIds.size === 1) {
    const [id] = selectedIds
    ui.toggleCallout(id)
  } else if (hoveredId) {
    ui.toggleCallout(hoveredId)
  }
}

function saveOrStartPreset(): void {
  const draft = usePresetDraftStore.getState()
  const { selectedIds } = useSelectionStore.getState()
  if (selectedIds.size > 0) draft.openNaming([...selectedIds])
  else draft.startCollecting()
}

const RULES: readonly ShortcutRule[] = [
  { id: 'back', keys: ['z'], modifier: true, preventDefault: true, run: goBack },
  { id: 'snapshot', keys: ['s'], modifier: true, preventDefault: true, run: openSnapshot },
  {
    id: 'zoomIn',
    keys: ['=', '+'],
    modifier: true,
    preventDefault: true,
    run: () => camera()?.zoomBy(ZOOM_IN_FACTOR),
  },
  {
    id: 'zoomOut',
    keys: ['-', '_'],
    modifier: true,
    preventDefault: true,
    run: () => camera()?.zoomBy(ZOOM_OUT_FACTOR),
  },
  {
    id: 'resetView',
    keys: ['0'],
    modifier: true,
    preventDefault: true,
    run: () => camera()?.resetView(),
  },

  {
    id: 'autoRotate',
    keys: [' '],
    notOnButton: true,
    preventDefault: true,
    run: () => useUiStore.getState().toggleAutoRotate(),
  },

  { id: 'restore', keys: ['h'], shift: true, run: restoreAll },
  { id: 'labels', keys: ['l'], shift: true, run: toggleLabels },
  { id: 'viewBottom', keys: ['b'], shift: true, run: view('bottom') },

  { id: 'escape', keys: ['escape'], run: cancelDraftOrClearSelection },
  { id: 'hide', keys: ['delete', 'backspace'], preventDefault: true, run: hideSelection },
  { id: 'isolate', keys: ['enter'], preventDefault: true, run: isolateIfAnySelected },
  { id: 'explode', keys: ['e'], run: toggleExplode },
  { id: 'callout', keys: ['c'], run: toggleCallout },
  { id: 'note', keys: ['n'], run: addNoteForSelection },
  { id: 'preset', keys: ['p'], run: saveOrStartPreset },

  { id: 'toolOrbit', keys: ['o'], run: tool('orbit') },
  { id: 'toolZoom', keys: ['z'], run: tool('zoom') },
  { id: 'toolSelect', keys: ['v'], run: tool('select') },
  { id: 'toolPan', keys: ['h'], run: tool('pan') },

  { id: 'viewFront', keys: ['f'], run: view('front') },
  { id: 'viewBack', keys: ['b'], run: view('back') },
  { id: 'viewLeft', keys: ['l'], run: view('left') },
  { id: 'viewRight', keys: ['r'], run: view('right') },
  { id: 'viewSide', keys: ['s'], run: view('side') },
  { id: 'viewTop', keys: ['t'], run: view('top') },
]

export const SHORTCUT_RULES = RULES

/**
 * Explore-mode shortcuts. They run in *both* modes.
 *
 * The drawing hook uses a capture-phase listener and calls `stopImmediatePropagation()`
 * for the keys it owns (tool letters, Ctrl+Z/Y, Ctrl+A, Ctrl+D, arrows, layer brackets,
 * Space-to-orbit). Everything else — Enter to isolate, Delete to hide, Shift+H/L/B,
 * N, P, F, S, Ctrl+S, Ctrl+=/-/0, Escape — falls through and behaves exactly like
 * explore mode.
 */
export function useViewerShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || document.querySelector('dialog[open]')) return
      if (useNotesUiStore.getState().target !== null) return
      if (event.altKey) return

      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const onButton = isOnButton(event.target)

      for (const rule of RULES) {
        if ((rule.modifier ?? false) !== modifier) continue
        if ((rule.shift ?? false) !== shift) continue
        if (!rule.keys.includes(key)) continue
        if (rule.notOnButton && onButton) continue

        if (rule.preventDefault) event.preventDefault()
        rule.run()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
