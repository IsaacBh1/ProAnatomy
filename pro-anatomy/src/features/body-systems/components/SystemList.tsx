import { CheckboxRow } from '@/components/ui'
import type { SystemId } from '@/types/anatomy'
import type { SystemDefinition } from '../types'

interface SystemListProps {
  systems: readonly SystemDefinition[]
  visibility: Record<SystemId, boolean>
  counts?: Partial<Record<SystemId, number>>
  onToggle: (id: SystemId) => void
}

export function SystemList({ systems, visibility, counts, onToggle }: SystemListProps) {
  return (
    <div className="flex flex-col gap-2">
      {systems.map(({ id, label, color }) => (
        <CheckboxRow
          key={id}
          label={label}
          checked={visibility[id]}
          count={counts?.[id]}
          onCheckedChange={() => onToggle(id)}
          leading={
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          }
        />
      ))}
    </div>
  )
}
