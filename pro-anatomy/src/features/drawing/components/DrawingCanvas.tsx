// src/features/drawing/components/DrawingCanvas.tsx
import { useRef } from 'react'
import { ELEMENT_TOOLS } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import { useDrawingInteractions } from '../hooks/useDrawingInteractions'
import { useUiStore } from '@/store/uiStore'
import { DrawingLayer } from './DrawingLayer'
import { SelectionOverlay } from './SelectionOverlay'
import { TextEditor } from './TextEditor'

/**
 * SVG overlay. The wrapper is `pointer-events: none` so every gesture (drawing,
 * picking, band select, orbit) is dispatched to the WebGL canvas underneath.
 * `useDrawingInteractions` decides, per pointerdown, whether to claim it.
 *
 * The screen layer only handles screen-space gestures. When the drawing space is
 * `surface`, `SurfaceDrawingSurface` owns the pointer instead — the two are
 * mutually exclusive by design, so the screen layer simply doesn't bind.
 *
 * The `<TextEditor>` is a plain sibling: its `<input>` re-enables pointer events
 * itself (see TextEditor.tsx), so it's clickable and focusable like any DOM input.
 */
export function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerMode = useUiStore((s) => s.viewerMode)
  const drawingSpace = useUiStore((s) => s.drawingSpace)
  const orbitOverride = useUiStore((s) => s.orbitOverride)
  const tool = useDrawingStore((s) => s.tool)
  const editingTextId = useDrawingStore((s) => s.editingTextId)

  const isScreenDrawing =
    viewerMode === 'draw' &&
    drawingSpace === 'screen' &&
    !orbitOverride &&
    ELEMENT_TOOLS.has(tool)

  useDrawingInteractions({ containerRef, enabled: isScreenDrawing })

  if (viewerMode !== 'draw') return null

  const showTextEditor = tool === 'text' || editingTextId !== null

  return (
    <div
      ref={containerRef}
      data-drawing-surface
      className="pointer-events-none absolute inset-0 z-[7] select-none"
    >
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
        <DrawingLayer />
        <SelectionOverlay />
      </svg>
      {showTextEditor && <TextEditor />}
    </div>
  )
}
