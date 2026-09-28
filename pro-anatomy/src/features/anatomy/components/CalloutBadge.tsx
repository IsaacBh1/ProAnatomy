import { Tag, X } from '@phosphor-icons/react'
import { Button, Chip } from '@/components/ui'
import { useUiStore } from '@/store/uiStore'
import type { ModelObject } from '../utils/buildModelObject'

interface CalloutBadgeProps {
  entries: ModelObject['entries'] | undefined
}

/**
 * Stack of chips, one per callout, each with its own ✕, plus a "Clear all" when there is more
 * than one. Critical when a called-out organ is hidden or its system is off: its label can't
 * render, and this is how you find your way back to it.
 */
export function CalloutBadge({ entries }: CalloutBadgeProps) {
  const calloutIds = useUiStore((state) => state.calloutIds)
  const removeCallout = useUiStore((state) => state.removeCallout)
  const clearCallouts = useUiStore((state) => state.clearCallouts)

  if (calloutIds.size === 0) return null
  const ids = [...calloutIds]

  return (
    <div
      role="status"
      aria-label={`${ids.length} callout${ids.length > 1 ? 's' : ''}`}
      className="pointer-events-none absolute top-[86px] left-6 z-10 flex max-h-[240px] w-[240px] flex-col items-start gap-1 overflow-y-auto scrollbar-hidden"
    >
      {ids.map((id) => {
        const name = entries?.get(id)?.part.name ?? id
        return (
          <div
            key={id}
            className="pointer-events-auto flex w-full items-center gap-2 rounded-full border border-border bg-surface py-0.5 pr-1 pl-3 text-xs text-content shadow-sm"
          >
            <Tag size={12} aria-hidden className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <Button
              icon={X}
              aria-label={`Remove callout for ${name}`}
              title="Remove this callout"
              onClick={() => removeCallout(id)}
            />
          </div>
        )
      })}

      {ids.length > 1 && (
        <Chip onClick={clearCallouts} className="pointer-events-auto">
          Clear all callouts
        </Chip>
      )}
    </div>
  )
}
