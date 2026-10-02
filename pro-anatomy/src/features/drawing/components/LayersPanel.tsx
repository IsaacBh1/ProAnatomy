import {
  Stack,
  ArrowUp,
  ArrowDown,
  ArrowsDownUp,
  Trash,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { useDrawingStore } from '../store/drawingStore'
import type { DrawElement } from '../types'
import { cn } from '@/utils/cn'

const LABELS: Record<DrawElement['type'], string> = {
  freehand: 'Freehand',
  line: 'Line',
  arrow: 'Arrow',
  rect: 'Rectangle',
  ellipse: 'Ellipse',
  text: 'Text',
}

const describe = (el: DrawElement): string => {
  if (el.type === 'text') return el.text.slice(0, 24) || 'Text'
  return LABELS[el.type]
}

/**
 * Bottom-to-top layer list (topmost first). Reordering is exposed as four commands so
 * the same actions can be reused from keyboard shortcuts and (later) a context menu.
 */
export function LayersPanel() {
  const elements = useDrawingStore((s) => s.elements)
  const selectedIds = useDrawingStore((s) => s.selectedIds)
  const selectElement = useDrawingStore((s) => s.selectElement)
  const bringForward = useDrawingStore((s) => s.bringForward)
  const sendBackward = useDrawingStore((s) => s.sendBackward)
  const bringToFront = useDrawingStore((s) => s.bringToFront)
  const deleteElements = useDrawingStore((s) => s.deleteElements)

  const reversed = [...elements].reverse()

  return (
    <div className="flex w-64 flex-col gap-1 rounded-2xl border border-border bg-surface p-2 shadow-xl">
      <header className="flex items-center justify-between px-2 py-1 text-xs font-medium">
        <span className="flex items-center gap-1">
          <Stack size={14} aria-hidden />
          Layers
        </span>
        <span className="text-muted">{elements.length}</span>
      </header>

      {elements.length === 0 ? (
        <p className="px-2 py-3 text-xs text-muted">Nothing drawn yet.</p>
      ) : (
        <ul role="listbox" aria-label="Drawing layers" className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {reversed.map((el, i) => {
            const isSelected = selectedIds.has(el.id)
            const isTop = i === 0
            const isBottom = i === reversed.length - 1
            return (
              <li key={el.id}>
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-md px-1 py-0.5',
                    isSelected ? 'bg-surface-raised' : 'hover:bg-surface-raised/60',
                  )}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => selectElement(el.id, e.shiftKey)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left"
                  >
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-sm border border-border"
                      style={{
                        backgroundColor:
                          el.type === 'text' ? 'transparent' : el.style.stroke,
                      }}
                    />
                    <span className="truncate text-xs">{describe(el)}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      icon={ArrowUp}
                      aria-label="Bring forward"
                      disabled={isTop}
                      onClick={() => bringForward([el.id])}
                      className="size-6"
                    />
                    <Button
                      icon={ArrowDown}
                      aria-label="Send backward"
                      disabled={isBottom}
                      onClick={() => sendBackward([el.id])}
                      className="size-6"
                    />
                    <Button
                      icon={ArrowsDownUp}
                      aria-label="Bring to front"
                      disabled={isTop}
                      onClick={() => bringToFront([el.id])}
                      className="size-6"
                    />
                    <Button
                      icon={Trash}
                      aria-label="Delete"
                      onClick={() => deleteElements([el.id])}
                      className="size-6"
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
