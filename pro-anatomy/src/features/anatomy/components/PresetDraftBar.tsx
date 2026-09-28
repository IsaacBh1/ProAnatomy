import { Button, Pill } from '@/components/ui'
import { useSelectionStore } from '@/store/selectionStore'
import { usePresetDraftStore } from '../store/presetDraftStore'

/**
 * Status bar for "collecting" mode: the user pressed + (or P with nothing selected) and is
 * picking organs in the viewer. Hidden while the naming dialog is up, so there's only ever
 * one visible way to cancel.
 */
export function PresetDraftBar() {
  const collecting = usePresetDraftStore((state) => state.collecting)
  const pendingIds = usePresetDraftStore((state) => state.pendingIds)
  const openNaming = usePresetDraftStore((state) => state.openNaming)
  const reset = usePresetDraftStore((state) => state.reset)

  const selectedIds = useSelectionStore((state) => state.selectedIds)
  const count = selectedIds.size

  if (!collecting || pendingIds !== null) return null

  return (
    <Pill role="status" className="pointer-events-auto gap-2 pr-1 pl-4">
      <span className="text-sm">
        {count > 0
          ? `${count} organ${count === 1 ? '' : 's'} selected`
          : 'Pick organs to save as a preset'}
      </span>
      <Button className="border border-border px-4" onClick={reset}>
        Cancel
      </Button>
      <Button
        disabled={count === 0}
        className="bg-content text-canvas hover:bg-content/85"
        onClick={() => openNaming([...selectedIds])}
      >
        Next
      </Button>
    </Pill>
  )
}
