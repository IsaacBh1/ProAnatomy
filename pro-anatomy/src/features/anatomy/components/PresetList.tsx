import { X } from '@phosphor-icons/react'
import { Button, CheckboxRow } from '@/components/ui'
import type { AvailablePreset } from '../types'

interface PresetListProps {
  items: readonly AvailablePreset[]
  activeIds: readonly string[]
  /** Ids of presets the user created: only these get a delete affordance. */
  customIds: ReadonlySet<string>
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function PresetList({ items, activeIds, customIds, onToggle, onRemove }: PresetListProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ preset, partIds }) => (
        <CheckboxRow
          key={preset.id}
          label={preset.label}
          count={partIds.length}
          checked={activeIds.includes(preset.id)}
          onCheckedChange={() => onToggle(preset.id)}
          trailing={
            customIds.has(preset.id) ? (
              <Button
                icon={X}
                aria-label={`Delete preset ${preset.label}`}
                title="Delete preset"
                onClick={() => onRemove(preset.id)}
                className="size-6"
              />
            ) : null
          }
        />
      ))}
    </div>
  )
}
