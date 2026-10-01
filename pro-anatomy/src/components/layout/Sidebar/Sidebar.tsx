import type { ReactNode } from 'react'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

interface SidebarProps {
  open: boolean
  /** Called when the mobile backdrop is tapped. Ignored on desktop. */
  onClose?: () => void
  children: ReactNode
}

/**
 * Themed, collapsible sidebar.
 *
 * Two layouts, one component:
 *   • desktop (≥ md) — in-flow column that animates its own width to 0
 *   • mobile (< md)  — fixed drawer that slides in from the left, over a scrim
 *
 * The transition property differs by mode: desktop animates `width`, mobile
 * animates `transform`. Sharing one would animate the wrong thing on one side.
 */
export function Sidebar({ open, onClose, children }: SidebarProps) {
  const isDesktop = useIsDesktop()

  return (
    <>
      {!isDesktop && open && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        aria-hidden={!open}
        className={cn(
          'flex h-full shrink-0 flex-col overflow-hidden bg-surface',
          isDesktop
            ? cn(
                'relative transition-[width] duration-200',
                open ? 'w-[320px] border-r border-border' : 'w-0 border-r-0',
              )
            : cn(
                'fixed inset-y-0 left-0 z-40 w-[min(320px,88vw)] border-r border-border shadow-2xl',
                'transition-transform duration-200',
                open ? 'translate-x-0' : '-translate-x-full',
              ),
        )}
      >
        <div className="scrollbar-hidden flex h-full flex-col gap-4 overflow-y-auto px-5 py-6">
          {children}
        </div>
      </aside>
    </>
  )
}
