import { Palette, LineSegments, Drop } from '@phosphor-icons/react'
import { Pill } from '@/components/ui'
import { PALETTE, STROKE_WIDTHS } from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import type { DashStyle } from '../types'
import { cn } from '@/utils/cn'

const DASHES: readonly { id: DashStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
]

/**
 * Floating style controls. Kept separate from the toolbar so adding a new style
 * dimension (fill, corner radius, shadow) is a local change.
 */
export function StylePanel() {
  const style = useDrawingStore((s) => s.style)
  const setStyle = useDrawingStore((s) => s.setStyle)

  return (
    <Pill className="gap-3 px-3 py-2">
      {/* Stroke colour */}
      <section aria-label="Stroke colour" className="flex items-center gap-1">
        <Palette size={14} aria-hidden className="text-muted" />
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Stroke ${color}`}
            aria-pressed={style.stroke === color}
            onClick={() => setStyle({ stroke: color })}
            style={{ backgroundColor: color }}
            className={cn(
              'size-5 shrink-0 rounded-full border transition-transform',
              style.stroke === color ? 'scale-110 border-content' : 'border-border hover:scale-105',
            )}
          />
        ))}
      </section>

      <div className="h-5 w-px bg-border" aria-hidden />

      {/* Fill */}
      <section aria-label="Fill" className="flex items-center gap-1">
        <Drop size={14} aria-hidden className="text-muted" />
        <button
          type="button"
          aria-label="No fill"
          aria-pressed={style.fill === null}
          onClick={() => setStyle({ fill: null })}
          className={cn(
            'grid size-6 place-items-center rounded-md border border-border text-[10px]',
            style.fill === null && 'bg-surface-raised',
          )}
        >
          ∅
        </button>
        <button
          type="button"
          aria-label="Soft fill"
          aria-pressed={style.fill === 'soft'}
          onClick={() => setStyle({ fill: 'soft' })}
          style={{ backgroundColor: `${style.stroke}33` }}
          className={cn(
            'size-6 rounded-md border border-border',
            style.fill === 'soft' && 'ring-2 ring-content',
          )}
        />
        <button
          type="button"
          aria-label="Solid fill"
          aria-pressed={style.fill === 'solid'}
          onClick={() => setStyle({ fill: 'solid' })}
          style={{ backgroundColor: style.stroke }}
          className={cn(
            'size-6 rounded-md border border-border',
            style.fill === 'solid' && 'ring-2 ring-content',
          )}
        />
      </section>

      <div className="h-5 w-px bg-border" aria-hidden />

      {/* Stroke width */}
      <section aria-label="Stroke width" className="flex items-center gap-1">
        <LineSegments size={14} aria-hidden className="text-muted" />
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            aria-label={`Width ${w}`}
            aria-pressed={style.strokeWidth === w}
            onClick={() => setStyle({ strokeWidth: w })}
            className={cn(
              'grid size-6 place-items-center rounded-md border border-border text-[10px]',
              style.strokeWidth === w && 'bg-surface-raised',
            )}
          >
            <span
              style={{ width: 14, height: w, borderRadius: w }}
              className="block bg-content"
            />
          </button>
        ))}
      </section>

      <div className="h-5 w-px bg-border" aria-hidden />

      {/* Dash */}
      <section aria-label="Dash style" className="flex items-center gap-1">
        {DASHES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={style.dash === id}
            onClick={() => setStyle({ dash: id })}
            className={cn(
              'rounded-md border border-border px-2 py-1 text-[10px]',
              style.dash === id && 'bg-surface-raised',
            )}
          >
            {label}
          </button>
        ))}
      </section>
    </Pill>
  )
}
