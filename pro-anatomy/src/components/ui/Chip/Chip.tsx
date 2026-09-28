import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export function Chip({ className, type = 'button', ...props }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-w-10 items-center justify-center rounded-full border border-border bg-surface-raised px-2 py-0.5',
        'text-[11px] font-medium text-content transition-colors hover:bg-border',
        className,
      )}
      {...props}
    />
  )
}
