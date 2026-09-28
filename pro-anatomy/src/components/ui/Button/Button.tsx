import type { ButtonHTMLAttributes } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: Icon
  active?: boolean
}

export function Button({
  icon: IconComponent,
  active = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconOnly = !children

  return (
    <button
      type={type}
      data-active={active || undefined}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full text-sm text-content transition-colors',
        'hover:bg-border focus-visible:outline-2 focus-visible:outline-muted',
        'disabled:pointer-events-none disabled:opacity-40',
        iconOnly ? 'w-8' : 'pr-4 pl-3',
        active && 'bg-surface-raised',
        className,
      )}
      {...rest}
    >
      {IconComponent && <IconComponent size={16} aria-hidden />}
      {children}
    </button>
  )
}
