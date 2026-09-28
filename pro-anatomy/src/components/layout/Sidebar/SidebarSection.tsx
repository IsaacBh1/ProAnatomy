import { useId, useState, type ReactNode } from 'react'
import { CaretDown, type Icon } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface SidebarSectionProps {
  icon: Icon
  title: string
  actions?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export function SidebarSection({
  icon: IconComponent,
  title,
  actions,
  defaultOpen = true,
  children,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <IconComponent size={18} aria-hidden />
          <h2 className="text-sm font-medium">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-0.5 hover:bg-surface-raised"
          >
            <CaretDown size={18} className={cn('transition-transform', !open && '-rotate-90')} />
          </button>
        </div>
      </header>
      <div id={contentId} className={cn('flex flex-col gap-2', !open && 'hidden')}>
        {children}
      </div>
    </section>
  )
}
