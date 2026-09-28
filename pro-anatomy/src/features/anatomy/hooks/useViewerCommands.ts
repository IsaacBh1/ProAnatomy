import { useCallback, useMemo } from 'react'
import { useSelectionStore } from '@/store/selectionStore'
import type { ViewerCommandId } from '@/types/anatomy'
import {
  goBack,
  hideSelection,
  openSnapshot,
  restoreAll,
  toggleIsolate,
} from '../services/viewCommands'
import { useCaptureStore } from '../store/captureStore'
import { useViewStore } from '../store/viewStore'
import type { CommandState } from '../types'

/** Adding a toolbar command = one entry here, plus one in TOOLBAR_ITEMS. */
const COMMANDS: Record<ViewerCommandId, () => void> = {
  back: goBack,
  isolate: toggleIsolate,
  hide: hideSelection,
  restore: restoreAll,
  snapshot: openSnapshot,
}

export function useViewerCommands() {
  const canGoBack = useViewStore((state) => state.history.length > 0)
  const isIsolated = useViewStore((state) => state.isolatedIds !== null)
  const hiddenCount = useViewStore((state) => state.hiddenIds.size)
  const hasSelection = useSelectionStore((state) => state.selectedIds.size > 0)
  const canCapture = useCaptureStore((state) => state.capture !== null)

  const commandState = useMemo<CommandState>(
    () => ({
      back: { disabled: !canGoBack },
      isolate: { active: isIsolated, disabled: !isIsolated && !hasSelection },
      hide: { disabled: !hasSelection },
      restore: { disabled: hiddenCount === 0 },
      snapshot: { disabled: !canCapture },
    }),
    [canGoBack, isIsolated, hasSelection, hiddenCount, canCapture],
  )

  const run = useCallback((command: ViewerCommandId) => COMMANDS[command](), [])

  return { run, commandState }
}
