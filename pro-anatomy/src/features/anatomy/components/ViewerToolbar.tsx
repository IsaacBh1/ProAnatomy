import { Button, Pill, Tooltip } from '@/components/ui'
import type { ToolId, ViewerCommandId } from '@/types/anatomy'
import { SHORTCUTS, formatShortcut } from '../constants/shortcuts'
import { TOOLBAR_ITEMS } from '../constants/toolbarItems'
import type { CommandState } from '../types'

interface ViewerToolbarProps {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
  onCommand: (command: ViewerCommandId) => void
  commandState?: CommandState
}

export function ViewerToolbar({
  activeTool,
  onToolChange,
  onCommand,
  commandState,
}: ViewerToolbarProps) {
  return (
    <Pill role="toolbar" aria-label="Viewer tools" className="overflow-visible">
      {TOOLBAR_ITEMS.map((item) => {
        const info = SHORTCUTS[item.shortcut]
        const shortcutLabel = formatShortcut(item.shortcut)

        if (item.kind === 'tool') {
          const active = item.id === activeTool
          return (
            <Tooltip key={item.id} label={info.label} shortcut={shortcutLabel}>
              <Button
                icon={item.icon}
                active={active}
                aria-label={info.label}
                aria-pressed={active}
                aria-keyshortcuts={info.aria}
                onClick={() => onToolChange(item.id)}
              >
                {active ? info.label.split(' ')[0].toLowerCase() : null}
              </Button>
            </Tooltip>
          )
        }

        const state = commandState?.[item.id]
        return (
          <Tooltip key={item.id} label={info.label} shortcut={shortcutLabel}>
            <Button
              icon={item.icon}
              active={state?.active}
              disabled={state?.disabled}
              aria-pressed={state?.active}
              aria-label={info.label}
              aria-keyshortcuts={info.aria}
              onClick={() => onCommand(item.id)}
            />
          </Tooltip>
        )
      })}
    </Pill>
  )
}
