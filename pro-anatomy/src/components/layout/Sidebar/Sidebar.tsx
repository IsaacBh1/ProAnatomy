import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SidebarProps {
  open: boolean
  children: ReactNode
}

/**
 * Themed, collapsible sidebar. Scrolls internally, but the scrollbar is hidden via
 * `scrollbar-hidden` so the design's right edge stays clean.
 */
export function Sidebar({ open, children }: SidebarProps) {
  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'flex h-full shrink-0 flex-col gap-4 overflow-hidden bg-surface transition-[width] duration-200',
        open ? 'w-[320px] border-r border-border' : 'w-0 border-r-0',
      )}
    >
      <div className="scrollbar-hidden flex h-full flex-col gap-4 overflow-y-auto px-5 py-6">
        {children}
      </div>
    </aside>
  )
}
