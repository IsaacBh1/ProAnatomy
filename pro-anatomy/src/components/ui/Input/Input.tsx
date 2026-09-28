import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/utils/cn'

export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return (
    <input
      className={cn(
        'h-8 rounded-full border border-border bg-surface-raised px-3 text-sm text-content outline-none',
        'focus:border-muted',
        className,
      )}
      {...props}
    />
  )
}
