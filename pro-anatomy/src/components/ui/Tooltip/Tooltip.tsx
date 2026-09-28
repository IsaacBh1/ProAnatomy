import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  label: string
  shortcut?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
  className?: string
}

/** Attaches `aria-describedby` to the child so screen readers announce the label and shortcut. */
function withDescribedBy(node: ReactNode, id: string): ReactNode {
  if (!isValidElement(node)) return node
  return cloneElement(node as ReactElement<Record<string, unknown>>, {
    'aria-describedby': id,
  })
}

/**
 * Lightweight, CSS-only tooltip. Shows on hover *and* on keyboard focus, so it also helps
 * people who tab to a button discover its shortcut before pressing it.
 */
export function Tooltip({ label, shortcut, side = 'bottom', children, className }: TooltipProps) {
  const id = useId()

  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {withDescribedBy(children, id)}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap text-content shadow-xl',
          'opacity-0 transition-opacity duration-150',
          'group-focus-within/tip:opacity-100 group-hover/tip:opacity-100',
          side === 'bottom' && 'top-full left-1/2 mt-2 -translate-x-1/2',
          side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
          side === 'right' && 'top-1/2 left-full ml-2 -translate-y-1/2',
          side === 'left' && 'top-1/2 right-full mr-2 -translate-y-1/2',
        )}
      >
        <span>{label}</span>
        {shortcut && (
          <kbd className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {shortcut}
          </kbd>
        )}
      </span>
    </span>
  )
}
