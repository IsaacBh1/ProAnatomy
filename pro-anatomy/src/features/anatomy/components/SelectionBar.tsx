import { X } from '@phosphor-icons/react'
import { Button, Chip, Pill } from '@/components/ui'
import { useSelectionStore } from '@/store/selectionStore'
import { clearSelection, exitIsolation } from '../services/viewCommands'
import { useViewStore } from '../store/viewStore'
import type { ModelObject } from '../utils/buildModelObject'

interface SelectionBarProps {
  entries: ModelObject['entries'] | undefined
}

function describe(
  selected: ReadonlySet<string>,
  isolatedCount: number,
  entries: SelectionBarProps['entries'],
): string {
  if (selected.size === 1) {
    const [id] = selected
    return entries?.get(id)?.part.name ?? id
  }
  if (selected.size > 1) return `${selected.size} parts selected`
  return `Isolated view · ${isolatedCount} parts`
}

export function SelectionBar({ entries }: SelectionBarProps) {
  const selectedIds = useSelectionStore((state) => state.selectedIds)
  const isolatedIds = useViewStore((state) => state.isolatedIds)

  if (selectedIds.size === 0 && !isolatedIds) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[84px] z-10 flex justify-center">
      <Pill className="gap-2 pr-1 pl-4" role="status">
        <span className="text-sm font-medium">
          {describe(selectedIds, isolatedIds?.size ?? 0, entries)}
        </span>
        {selectedIds.size === 1 && !isolatedIds && (
          <span className="hidden text-[11px] text-muted sm:inline">Double-click to isolate</span>
        )}
        {isolatedIds && <Chip onClick={exitIsolation}>Exit isolate</Chip>}
        {selectedIds.size > 0 && (
          <Button
            icon={X}
            aria-label="Clear selection"
            title="Clear selection (Esc)"
            onClick={clearSelection}
          />
        )}
      </Pill>
    </div>
  )
}
