// src/features/drawing/hooks/useDrawingShortcuts.ts
import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useDrawingStore } from '../store/drawingStore'
import { translateElement } from '../utils/geometry'
import type { ToolId } from '../types'

const TOOL_KEYS: Record<string, ToolId> = {
  o: 'orbit',
  z: 'zoom',
  h: 'pan',
  v: 'select',
  b: 'brush',
  e: 'eraser',
  l: 'line',
  a: 'arrow',
  r: 'rect',
  c: 'ellipse',
  t: 'text',
}

const NUDGE = 1
const NUDGE_FAST = 10

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

const isOnButton = (t: EventTarget | null) =>
  t instanceof HTMLElement && t.closest('button, a, [role="button"]') !== null

export function useDrawingShortcuts(): void {
  // ── Space: hold to orbit ────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      if (useUiStore.getState().viewerMode !== 'draw') return
      if (isTyping(e.target)) return
      if (isOnButton(e.target)) return
      if (document.querySelector('dialog[open]')) return
      e.preventDefault()
      e.stopImmediatePropagation()
      useUiStore.getState().setOrbitOverride(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (useUiStore.getState().orbitOverride) useUiStore.getState().setOrbitOverride(false)
    }
    const blur = () => useUiStore.getState().setOrbitOverride(false)

    window.addEventListener('keydown', down, { capture: true })
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down, { capture: true })
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // ── Everything else ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (useUiStore.getState().viewerMode !== 'draw') return
      if (isTyping(event.target)) return
      if (document.querySelector('dialog[open]')) return
      if (event.altKey) return

      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const store = useDrawingStore.getState()
      const claim = () => event.stopImmediatePropagation()

      // Ctrl+Z / Ctrl+Y — drawing undo/redo. Claims these so explore's
      // Ctrl+Z (camera Back) doesn't fire while in draw mode.
      if (mod && key === 'z') {
        event.preventDefault()
        claim()
        if (shift) store.redo()
        else store.undo()
        return
      }
      if (mod && key === 'y') {
        event.preventDefault()
        claim()
        store.redo()
        return
      }

      // Ctrl+A / Ctrl+D — only meaningful for the drawing scene, so claim them.
      if (mod && key === 'a') {
        event.preventDefault()
        claim()
        store.selectAll()
        return
      }
      if (mod && key === 'd') {
        event.preventDefault()
        claim()
        store.duplicateSelected()
        return
      }

      // Every other modifier combo (Ctrl+S, Ctrl+=, Ctrl+-, Ctrl+0) falls through
      // to explore.
      if (mod) return

      // Space and letter keys for tools.
      const tool = TOOL_KEYS[key]
      if (tool) {
        event.preventDefault()
        claim()
        store.setTool(tool)
        return
      }

      // ─── Everything below only fires when a drawn element is selected.
      //     Since the Edit tool is currently disabled, `selectedIds` is always
      //     empty in draw mode, so these branches are inert. They're kept as
      //     scaffolding for the upcoming Edit feature.
      if (store.selectedIds.size === 0) {
        // Let Enter, Delete, Backspace, arrows, Escape, Shift+H/L/B, N, P,
        // F/S/R/L/B/T pass straight through to explore's shortcut handler.
        return
      }

      if (key === ']') {
        event.preventDefault()
        claim()
        const ids = [...store.selectedIds]
        if (shift) store.bringToFront(ids)
        else store.bringForward(ids)
        return
      }
      if (key === '[') {
        event.preventDefault()
        claim()
        const ids = [...store.selectedIds]
        if (shift) store.sendToBack(ids)
        else store.sendBackward(ids)
        return
      }

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault()
        claim()
        store.deleteElements([...store.selectedIds])
        return
      }

      const amount = shift ? NUDGE_FAST : NUDGE
      const dx = key === 'arrowleft' ? -amount : key === 'arrowright' ? amount : 0
      const dy = key === 'arrowup' ? -amount : key === 'arrowdown' ? amount : 0
      if (dx || dy) {
        event.preventDefault()
        claim()
        const selected = store.selectedIds
        store.snapshot()
        store.applyTransient((els) =>
          els.map((el) => (selected.has(el.id) ? translateElement(el, dx, dy) : el)),
        )
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [])
}
