// src/features/drawing/hooks/useDrawingInteractions.ts
import { useEffect, type RefObject } from 'react'
import { useDrawingStore, createId } from '../store/drawingStore'
import type {
  ArrowElement,
  DrawElement,
  EllipseElement,
  FreehandElement,
  LineElement,
  Point,
  RectElement,
  TextElement,
} from '../types'
import { findTopElementAt } from '../utils/geometry'

type Interaction =
  | { kind: 'idle' }
  | { kind: 'drafting' }
  | { kind: 'erasing' }

interface Options {
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
}

/**
 * Owns drawing-tool pointer interactions: brush, line, arrow, rect, ellipse, text,
 * eraser.
 *
 * NOT enabled when the Select tool is active (the parent gates on `ELEMENT_TOOLS`).
 * So when Select is on, this hook is silent and every pointer/keyboard gesture is
 * handled by the same code as explore mode — part picking, band rectangle, Enter,
 * Backspace, Shift+H, the context menu, and so on.
 */
export function useDrawingInteractions({ containerRef, enabled }: Options) {
  useEffect(() => {
    if (!enabled) return
    const svgWrapper = containerRef.current
    if (!svgWrapper) return
    const canvas = svgWrapper.parentElement?.querySelector('canvas')
    if (!canvas) return

    let interaction: Interaction = { kind: 'idle' }

    const localPoint = (event: PointerEvent): Point => {
      const rect = svgWrapper.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const store = useDrawingStore.getState()
      const p = localPoint(event)

      // Drawing tools always claim the pointer — nothing else needs it here.
      event.stopImmediatePropagation()

      const hit = findTopElementAt(store.elements, p)

      if (store.tool === 'eraser') {
        canvas.setPointerCapture(event.pointerId)
        interaction = { kind: 'erasing' }
        if (hit) store.deleteElements([hit.id])
        return
      }

      if (store.tool === 'text') {
        const element: TextElement = {
          id: createId('text'),
          type: 'text',
          x: p.x,
          y: p.y,
          text: '',
          fontSize: store.fontSize,
          style: { ...store.style, fill: null },
          createdAt: Date.now(),
        }
        store.setDraft(element)
        return
      }

      const draft = createDraft(store.tool, p, store.style)
      if (!draft) return
      store.setDraft(draft)
      canvas.setPointerCapture(event.pointerId)
      interaction = { kind: 'drafting' }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (interaction.kind === 'idle') return
      const store = useDrawingStore.getState()
      const p = localPoint(event)

      if (interaction.kind === 'drafting') {
        store.setDraft(updateDraft(store.draft, p))
        return
      }

      if (interaction.kind === 'erasing') {
        const hit = findTopElementAt(store.elements, p)
        if (hit) store.deleteElements([hit.id])
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (interaction.kind === 'idle') return
      const store = useDrawingStore.getState()
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (interaction.kind === 'drafting') {
        const d = store.draft
        const isEmpty =
          !d ||
          (d.type === 'rect' && d.width < 2 && d.height < 2) ||
          (d.type === 'ellipse' && d.rx < 1 && d.ry < 1) ||
          ((d.type === 'line' || d.type === 'arrow') &&
            Math.hypot(d.x2 - d.x1, d.y2 - d.y1) < 2) ||
          (d.type === 'freehand' && d.points.length < 2)
        if (isEmpty) store.setDraft(null)
        else store.commitDraft()
      }
      interaction = { kind: 'idle' }
    }

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true })
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true })
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [containerRef, enabled])
}

function createDraft(
  tool: ReturnType<typeof useDrawingStore.getState>['tool'],
  p: Point,
  style: ReturnType<typeof useDrawingStore.getState>['style'],
): DrawElement | null {
  const base = { style, createdAt: Date.now() }
  switch (tool) {
    case 'brush':
      return { ...base, id: createId('freehand'), type: 'freehand', points: [[p.x, p.y]] } satisfies FreehandElement
    case 'line':
      return { ...base, id: createId('line'), type: 'line', x1: p.x, y1: p.y, x2: p.x, y2: p.y } satisfies LineElement
    case 'arrow':
      return { ...base, id: createId('arrow'), type: 'arrow', x1: p.x, y1: p.y, x2: p.x, y2: p.y } satisfies ArrowElement
    case 'rect':
      return { ...base, id: createId('rect'), type: 'rect', x: p.x, y: p.y, width: 0, height: 0 } satisfies RectElement
    case 'ellipse':
      return { ...base, id: createId('ellipse'), type: 'ellipse', cx: p.x, cy: p.y, rx: 0, ry: 0 } satisfies EllipseElement
    default:
      return null
  }
}

function updateDraft(draft: DrawElement | null, p: Point): DrawElement | null {
  if (!draft) return null
  switch (draft.type) {
    case 'freehand':
      return { ...draft, points: [...draft.points, [p.x, p.y]] }
    case 'line':
    case 'arrow':
      return { ...draft, x2: p.x, y2: p.y }
    case 'rect':
      return { ...draft, width: p.x - draft.x, height: p.y - draft.y }
    case 'ellipse':
      return { ...draft, rx: Math.abs(p.x - draft.cx), ry: Math.abs(p.y - draft.cy) }
    default:
      return draft
  }
}
