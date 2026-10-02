import { useRef } from 'react'
import { ELEMENT_TOOLS } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import { useDrawingInteractions } from '../hooks/useDrawingInteractions'
import { useUiStore } from '@/store/uiStore'
import { DrawingLayer } from './DrawingLayer'
import { SelectionOverlay } from './SelectionOverlay'
import { TextEditor } from './TextEditor'

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
