import type { ComponentPropsWithRef } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface SearchInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
}

/** `className` styles the wrapper; every other prop (including `ref`) goes to the input. */
export function SearchInput({ value, onValueChange, className, ...rest }: SearchInputProps) {
  return (
    <div
      className={cn(
        'flex h-11 w-full items-center gap-2 overflow-hidden rounded-full border border-border bg-surface-raised px-4',
        'focus-within:border-muted',
        className,
      )}
    >
      <MagnifyingGlass size={20} aria-hidden className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base text-content outline-none placeholder:text-content/60"
        {...rest}
      />
    </div>
  )
}
