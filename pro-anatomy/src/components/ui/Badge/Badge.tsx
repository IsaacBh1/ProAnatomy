import type { ReactNode } from 'react'

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-surface-raised px-[5px] py-0.5 text-[11px] font-medium text-muted">
      {children}
    </span>
  )
}
