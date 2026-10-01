// src/features/anatomy/hooks/useViewerShortcuts.ts
import { useEffect } from 'react'
import { useDrawingStore } from '@/features/drawing/store/drawingStore'
import type { ToolId as DrawToolId } from '@/features/drawing/types'
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
const NUDGE = 1
const NUDGE_FAST = 10

// --------------------------------------------------------------- predicates

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const isOnButton = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest('button, a, [role="button"]') !== null

const isDrawMode = () => useUiStore.getState().viewerMode === 'draw'
const isExploreMode = () => useUiStore.getState().viewerMode === 'explore'
const hasDrawingSelection = () => useDrawingStore.getState().selectedIds.size > 0

const camera = () => useCameraStore.getState().api
const view = (id: StandardView) => () => camera()?.setStandardView(id)
const exploreTool = (id: 'orbit' | 'zoom' | 'select' | 'pan') => () =>
  useUiStore.getState().setActiveTool(id)
const drawTool = (id: DrawToolId) => () => useDrawingStore.getState().setTool(id)

// ------------------------------------------------------------------ actions

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

function deleteDrawingSelection(): void {
  const store = useDrawingStore.getState()
  store.deleteElements([...store.selectedIds])
}

function nudgeSelection(dx: number, dy: number, fast: boolean): void {
  const store = useDrawingStore.getState()
  if (store.selectedIds.size === 0) return
  const amount = fast ? NUDGE_FAST : NUDGE
  store.snapshot()
  store.translateSelection(dx * amount, dy * amount)
}

function reorderSelection(direction: 'forward' | 'backward' | 'front' | 'back'): void {
  const store = useDrawingStore.getState()
  if (store.selectedIds.size === 0) return
  const ids = [...store.selectedIds]
  if (direction === 'forward') store.bringForward(ids)
  else if (direction === 'backward') store.sendBackward(ids)
  else if (direction === 'front') store.bringToFront(ids)
  else store.sendToBack(ids)
}

// ---------------------------------------------------------------- rule shape

interface ShortcutRule {
  id: string
  keys: readonly string[]
  modifier?: boolean
  /** Default false. `'either'` disables shift matching for rules like Ctrl+= / Ctrl++. */
  shift?: boolean | 'either'
  /** Optional predicate: only run when this returns true. */
  when?: () => boolean
  preventDefault?: boolean
  run: (event: KeyboardEvent) => void
}

/**
 * One registry for every keyboard shortcut in the viewer.
 *
 * The rules are ordered by specificity. The first rule whose modifiers, key and
 * `when` predicate all match is the one that runs — nothing races via
 * `stopImmediatePropagation`, nothing runs in two places.
 */
const RULES: readonly ShortcutRule[] = [
  // ── Ctrl/Cmd ────────────────────────────────────────────────────────────
  {
    id: 'drawUndo',
    keys: ['z'],
    modifier: true,
    preventDefault: true,
    when: isDrawMode,
    run: () => useDrawingStore.getState().undo(),
  },
  {
    id: 'viewBack',
    keys: ['z'],
    modifier: true,
    preventDefault: true,
    when: isExploreMode,
    run: goBack,
  },
  {
    id: 'drawRedo',
    keys: ['y'],
    modifier: true,
    preventDefault: true,
    when: isDrawMode,
    run: () => useDrawingStore.getState().redo(),
  },
  {
    id: 'drawSelectAll',
    keys: ['a'],
    modifier: true,
    preventDefault: true,
    when: isDrawMode,
    run: () => useDrawingStore.getState().selectAll(),
  },
  {
    id: 'drawDuplicate',
    keys: ['d'],
    modifier: true,
    preventDefault: true,
    when: isDrawMode,
    run: () => useDrawingStore.getState().duplicateSelected(),
  },
  { id: 'snapshot', keys: ['s'], modifier: true, preventDefault: true, run: openSnapshot },
  {
    id: 'zoomIn',
    keys: ['=', '+'],
    modifier: true,
    shift: 'either',
    preventDefault: true,
    run: () => camera()?.zoomBy(ZOOM_IN_FACTOR),
  },
  {
    id: 'zoomOut',
    keys: ['-', '_'],
    modifier: true,
    shift: 'either',
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

  // ── Shift ───────────────────────────────────────────────────────────────
  { id: 'restore', keys: ['h'], shift: true, run: restoreAll },
  { id: 'labels', keys: ['l'], shift: true, run: toggleLabels },
  { id: 'viewBottom', keys: ['b'], shift: true, run: view('bottom') },
  {
    id: 'bringToFront',
    keys: [']'],
    shift: true,
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: () => reorderSelection('front'),
  },
  {
    id: 'sendToBack',
    keys: ['['],
    shift: true,
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: () => reorderSelection('back'),
  },

  // ── Unmodified, order matters ───────────────────────────────────────────
  { id: 'escape', keys: ['escape'], run: cancelDraftOrClearSelection },
  {
    id: 'drawDelete',
    keys: ['delete', 'backspace'],
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: deleteDrawingSelection,
  },
  { id: 'hide', keys: ['delete', 'backspace'], preventDefault: true, run: hideSelection },
  { id: 'isolate', keys: ['enter'], preventDefault: true, run: isolateIfAnySelected },
  { id: 'note', keys: ['n'], run: addNoteForSelection },
  { id: 'preset', keys: ['p'], run: saveOrStartPreset },

  // ── Tool letters, explore ───────────────────────────────────────────────
  { id: 'exploreToolOrbit', keys: ['o'], when: isExploreMode, run: exploreTool('orbit') },
  { id: 'exploreToolZoom', keys: ['z'], when: isExploreMode, run: exploreTool('zoom') },
  { id: 'exploreToolSelect', keys: ['v'], when: isExploreMode, run: exploreTool('select') },
  { id: 'exploreToolPan', keys: ['h'], when: isExploreMode, run: exploreTool('pan') },

  // ── Tool letters, draw ──────────────────────────────────────────────────
  { id: 'drawToolOrbit', keys: ['o'], when: isDrawMode, run: drawTool('orbit') },
  { id: 'drawToolZoom', keys: ['z'], when: isDrawMode, run: drawTool('zoom') },
  { id: 'drawToolPan', keys: ['h'], when: isDrawMode, run: drawTool('pan') },
  { id: 'drawToolSelect', keys: ['v'], when: isDrawMode, run: drawTool('select') },
  { id: 'drawToolEdit', keys: ['x'], when: isDrawMode, run: drawTool('edit') },
  { id: 'drawToolBrush', keys: ['b'], when: isDrawMode, run: drawTool('brush') },
  { id: 'drawToolEraser', keys: ['e'], when: isDrawMode, run: drawTool('eraser') },
  { id: 'drawToolLine', keys: ['l'], when: isDrawMode, run: drawTool('line') },
  { id: 'drawToolArrow', keys: ['a'], when: isDrawMode, run: drawTool('arrow') },
  { id: 'drawToolRect', keys: ['r'], when: isDrawMode, run: drawTool('rect') },
  { id: 'drawToolEllipse', keys: ['c'], when: isDrawMode, run: drawTool('ellipse') },
  { id: 'drawToolText', keys: ['t'], when: isDrawMode, run: drawTool('text') },

  // ── Single letters, explore-only view/actions ───────────────────────────
  { id: 'explode', keys: ['e'], when: isExploreMode, run: toggleExplode },
  { id: 'callout', keys: ['c'], when: isExploreMode, run: toggleCallout },
  { id: 'viewFront', keys: ['f'], when: isExploreMode, run: view('front') },
  { id: 'viewBack', keys: ['b'], when: isExploreMode, run: view('back') },
  { id: 'viewLeft', keys: ['l'], when: isExploreMode, run: view('left') },
  { id: 'viewRight', keys: ['r'], when: isExploreMode, run: view('right') },
  { id: 'viewSide', keys: ['s'], when: isExploreMode, run: view('side') },
  { id: 'viewTop', keys: ['t'], when: isExploreMode, run: view('top') },

  // ── Draw z-order ────────────────────────────────────────────────────────
  {
    id: 'bringForward',
    keys: [']'],
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: () => reorderSelection('forward'),
  },
  {
    id: 'sendBackward',
    keys: ['['],
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: () => reorderSelection('backward'),
  },

  // ── Draw nudge (arrow keys; Shift = faster) ─────────────────────────────
  {
    id: 'nudgeLeft',
    keys: ['arrowleft'],
    shift: 'either',
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: (e) => nudgeSelection(-1, 0, e.shiftKey),
  },
  {
    id: 'nudgeRight',
    keys: ['arrowright'],
    shift: 'either',
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: (e) => nudgeSelection(1, 0, e.shiftKey),
  },
  {
    id: 'nudgeUp',
    keys: ['arrowup'],
    shift: 'either',
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: (e) => nudgeSelection(0, -1, e.shiftKey),
  },
  {
    id: 'nudgeDown',
    keys: ['arrowdown'],
    shift: 'either',
    preventDefault: true,
    when: () => isDrawMode() && hasDrawingSelection(),
    run: (e) => nudgeSelection(0, 1, e.shiftKey),
  },
]

// ------------------------------------------------------------------- hook(s)

/**
 * The single global keydown handler for the viewer.
 *
 * Runs in *both* explore and draw modes. Rules use `when` predicates to gate
 * themselves, so there is exactly one place to look for "what does this key do
 * right now". Replaces the previous pair of competing listeners.
 */
export function useViewerShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (useUiStore.getState().dialogCount > 0) return
      if (useNotesUiStore.getState().target !== null) return
      if (event.altKey) return

      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey
      const shift = event.shiftKey

      for (const rule of RULES) {
        if ((rule.modifier ?? false) !== modifier) continue
        if (rule.shift !== 'either' && (rule.shift ?? false) !== shift) continue
        if (!rule.keys.includes(key)) continue
        if (rule.when && !rule.when()) continue

        if (rule.preventDefault) event.preventDefault()
        rule.run(event)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Space is special: it needs keydown *and* keyup. In draw mode it's a
  // hold-to-orbit override; in explore mode it toggles auto-rotation. Rule
  // matching in the loop above can't express a "hold" gesture, so it stays
  // separate — but it lives right next to its rules.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      if (isTypingTarget(event.target) || isOnButton(event.target)) return
      if (useUiStore.getState().dialogCount > 0) return
      if (useNotesUiStore.getState().target !== null) return

      event.preventDefault()
      if (useUiStore.getState().viewerMode === 'draw') {
        useUiStore.getState().setOrbitOverride(true)
      } else {
        useUiStore.getState().toggleAutoRotate()
      }
    }
    const up = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      if (useUiStore.getState().orbitOverride) useUiStore.getState().setOrbitOverride(false)
    }
    const blur = () => {
      if (useUiStore.getState().orbitOverride) useUiStore.getState().setOrbitOverride(false)
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
}

export { RULES as SHORTCUT_RULES }
