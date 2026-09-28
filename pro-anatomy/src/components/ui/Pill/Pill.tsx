import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/cn'

export function Pill({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-surface p-[5px]',
        className,
      )}
      {...props}
    />
  )
}
