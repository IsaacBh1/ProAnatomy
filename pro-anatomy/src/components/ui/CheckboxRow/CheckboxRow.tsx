import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Badge } from '../Badge/Badge'
import { Checkbox } from '../Checkbox/Checkbox'

interface CheckboxRowProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  leading?: ReactNode
  /** Rendered beside the badge, outside the label, so a nested button never toggles the row. */
  trailing?: ReactNode
  count?: number
  emphasized?: boolean
}

export function CheckboxRow({
  label,
  checked,
  onCheckedChange,
  leading,
  trailing,
  count,
  emphasized = false,
}: CheckboxRowProps) {
  return (
    <div className="flex w-full items-center gap-1">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-sm p-1 transition-colors hover:bg-surface-raised">
        <span className="flex min-w-0 items-center gap-[7px]">
          <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
          {leading}
          <span className={cn('truncate', emphasized ? 'text-sm font-medium' : 'text-xs')}>
            {label}
          </span>
        </span>
        {count !== undefined && <Badge>{count}</Badge>}
      </label>
      {trailing}
    </div>
  )
}
