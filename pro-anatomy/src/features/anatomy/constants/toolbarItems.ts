import * as react from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { ToolId, ViewerCommandId } from '@/types/anatomy'
import type { ShortcutId } from './shortcuts'

export type ToolbarItem =
  | { kind: 'tool'; id: ToolId; icon: Icon; label: string; shortcut: ShortcutId }
  | { kind: 'command'; id: ViewerCommandId; icon: Icon; label: string; shortcut: ShortcutId }

/** The order here is the order on screen. Add a command by appending here and in viewCommands. */
export const TOOLBAR_ITEMS: readonly ToolbarItem[] = [
  { kind: 'tool', id: 'orbit', icon: react.VectorThreeIcon, label: 'Orbit', shortcut: 'orbit' },
  { kind: 'tool', id: 'zoom', icon: react.MagnifyingGlassPlus, label: 'Zoom', shortcut: 'zoom' },
  { kind: 'tool', id: 'select', icon: react.Selection, label: 'Select', shortcut: 'select' },
  { kind: 'tool', id: 'pan', icon: react.Hand, label: 'Hand', shortcut: 'pan' },

  { kind: 'command', id: 'back', icon: react.ArrowUUpLeft, label: 'Back', shortcut: 'back' },
  { kind: 'command', id: 'isolate', icon: react.Crosshair, label: 'Isolate', shortcut: 'isolate' },
  { kind: 'command', id: 'hide', icon: react.EyeSlash, label: 'Hide', shortcut: 'hide' },
  { kind: 'command', id: 'restore', icon: react.Eye, label: 'Restore all', shortcut: 'restore' },
  { kind: 'command', id: 'snapshot', icon: react.Camera, label: 'Screenshot', shortcut: 'snapshot' },
]
