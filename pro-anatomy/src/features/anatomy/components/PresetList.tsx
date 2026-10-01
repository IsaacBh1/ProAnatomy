import { WarningCircle, X } from '@phosphor-icons/react'
import { Button, CheckboxRow, Tooltip } from '@/components/ui'
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
      {items.map(({ preset, partIds, missingCount }) => (
        <CheckboxRow
          key={preset.id}
          label={preset.label}
          count={partIds.length}
          checked={activeIds.includes(preset.id)}
          onCheckedChange={() => onToggle(preset.id)}
          trailing={
            <>
              {missingCount !== undefined && (
                <Tooltip
                  label={`${missingCount} part${missingCount === 1 ? '' : 's'} no longer exist in this model`}
                  side="top"
                >
                  <span
                    role="status"
                    aria-label={`${missingCount} parts missing`}
                    className="grid size-6 place-items-center text-amber-400"
                  >
                    <WarningCircle size={14} aria-hidden />
                  </span>
                </Tooltip>
              )}
              {customIds.has(preset.id) && (
                <Button
                  icon={X}
                  aria-label={`Delete preset ${preset.label}`}
                  title="Delete preset"
                  onClick={() => onRemove(preset.id)}
                  className="size-6"
                />
              )}
            </>
          }
        />
      ))}
    </div>
  )
}
