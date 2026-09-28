// src/features/drawing/components/TextEditor.tsx
import { useEffect, useRef, useState } from 'react'
import { useDrawingStore } from '../store/drawingStore'
import type { TextElement } from '../types'

/**
 * Inline text input, positioned over the SVG. Handles both composing a new text
 * element and re-editing an existing one.
 *
 * `pointerEvents: 'auto'` is critical here: the drawing wrapper is `pointer-events:
 * none` (so the canvas below can receive gestures), which means every child must opt
 * back in — otherwise the input is unreachable.
 */
export function TextEditor() {
  const draft = useDrawingStore((s) => s.draft)
  const editingTextId = useDrawingStore((s) => s.editingTextId)
  const elements = useDrawingStore((s) => s.elements)

  const editingEl = editingTextId
    ? (elements.find(
        (el) => el.id === editingTextId && el.type === 'text',
      ) as TextElement | undefined)
    : undefined
  const draftEl = draft?.type === 'text' ? (draft as TextElement) : undefined
  const target: TextElement | undefined = editingEl ?? draftEl
  const isEditing = editingEl !== undefined

  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!target) return
    setValue(isEditing ? target.text : '')
    const frame = requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      if (isEditing) el.select()
      else el.setSelectionRange(el.value.length, el.value.length)
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id, isEditing])

  if (!target) return null

  const commit = () => {
    const store = useDrawingStore.getState()
    if (isEditing) {
      store.commitTextEdit(value)
      return
    }
    const text = value.trim()
    if (text.length === 0) {
      store.setDraft(null)
      return
    }
    store.setDraft({ ...target, text })
    store.commitDraft()
  }

  const cancel = () => {
    const store = useDrawingStore.getState()
    if (isEditing) store.cancelTextEdit()
    else store.setDraft(null)
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => {
        const next = e.target.value
        setValue(next)
        if (isEditing && editingEl) {
          useDrawingStore
            .getState()
            .applyTransient((els) =>
              els.map((el) =>
                el.id === editingEl.id && el.type === 'text' ? { ...el, text: next } : el,
              ),
            )
        } else if (draftEl) {
          useDrawingStore.getState().setDraft({ ...draftEl, text: next })
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
          commit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          cancel()
        }
      }}
      onBlur={commit}
      style={{
        position: 'absolute',
        left: target.x - 2,
        top: target.y - target.fontSize * 1.15,
        fontSize: target.fontSize,
        fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
        color: target.style.stroke,
        background: 'var(--color-canvas)',
        border: `1px dashed ${target.style.stroke}`,
        borderRadius: 3,
        outline: 'none',
        padding: '0 4px',
        minWidth: 80,
        zIndex: 20,
        // Opt back into pointer events: the drawing wrapper turns them off wholesale.
        pointerEvents: 'auto',
      }}
      placeholder="Type…"
      spellCheck={false}
      aria-label={isEditing ? 'Edit text annotation' : 'Text annotation'}
    />
  )
}
