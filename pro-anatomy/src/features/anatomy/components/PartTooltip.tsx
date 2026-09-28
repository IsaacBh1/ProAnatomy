import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import type { AnatomyPart } from '../types/model'

const OFFSET_PX = 16

/** Follows the pointer via direct DOM writes, so moving the mouse never re-renders React. */
export function PartTooltip({ part }: { part: AnatomyPart | undefined }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const follow = (event: PointerEvent) => {
      ref.current?.style.setProperty(
        'transform',
        `translate(${event.clientX + OFFSET_PX}px, ${event.clientY + OFFSET_PX}px)`,
      )
    }
    window.addEventListener('pointermove', follow)
    return () => window.removeEventListener('pointermove', follow)
  }, [])

  // Always mounted (just hidden) so the transform is already correct when it appears.
  return (
    <div
      ref={ref}
      role="tooltip"
      aria-hidden={!part}
      className={cn(
        'pointer-events-none fixed top-0 left-0 z-30 max-w-64 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg',
        !part && 'hidden',
      )}
    >
      <p className="text-sm font-medium">{part?.name}</p>
      <p className="text-[11px] text-muted capitalize">{part?.system}</p>
    </div>
  )
}
