import type { InputHTMLAttributes } from 'react'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/utils/cn'

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'checked'
> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox({ checked, onCheckedChange, className, ...rest }: CheckboxProps) {
  return (
    <span className={cn('relative inline-flex size-[18px] shrink-0', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[2px] bg-border focus-visible:outline-2 focus-visible:outline-muted"
        {...rest}
      />
      <Check
        size={14}
        weight="bold"
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto hidden text-content peer-checked:block"
      />
    </span>
  )
}
