const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

const MOD_DISPLAY = isMac ? '⌘' : 'Ctrl'
const MOD_ARIA = isMac ? 'Meta' : 'Control'

export interface ShortcutInfo {
  /** Keys as displayed in the tooltip, e.g. ['Ctrl', 'Z']. */
  display: readonly string[]
  /** Value for the `aria-keyshortcuts` attribute (ARIA spec: no spaces around '+'). */
  aria: string
  label: string
}

/**
 * Single source of truth for every keyboard shortcut in the viewer.
 * Tooltips read `display`; the key handler in useViewerShortcuts follows the same keys.
 */
export const SHORTCUTS = {
  // Tools
  orbit: { display: ['O'], aria: 'O', label: 'Orbit' },
  zoom: { display: ['Z'], aria: 'Z', label: 'Zoom' },
  select: { display: ['V'], aria: 'V', label: 'Select' },
  pan: { display: ['H'], aria: 'H', label: 'Hand (pan)' },

  // Viewer commands
  back: { display: [MOD_DISPLAY, 'Z'], aria: `${MOD_ARIA}+Z`, label: 'Back' },
  isolate: { display: ['Enter'], aria: 'Enter', label: 'Isolate selection' },
  hide: { display: ['Del'], aria: 'Delete', label: 'Hide selection' },
  restore: { display: ['⇧', 'H'], aria: 'Shift+H', label: 'Restore all' },
  snapshot: { display: [MOD_DISPLAY, 'S'], aria: `${MOD_ARIA}+S`, label: 'Capture screenshot' },
  explode: { display: ['E'], aria: 'E', label: 'Toggle explode' },
  labels: { display: ['⇧', 'L'], aria: 'Shift+L', label: 'Toggle labels' },

  // Callouts, notes & presets
  callout: { display: ['C'], aria: 'C', label: 'Callout' },
  note: { display: ['N'], aria: 'N', label: 'Add note' },
  preset: { display: ['P'], aria: 'P', label: 'Save selection as preset' },

  // Search & selection
  search: { display: [MOD_DISPLAY, 'K'], aria: `${MOD_ARIA}+K`, label: 'Search organs' },
  clear: { display: ['Esc'], aria: 'Escape', label: 'Clear selection' },

  // Camera
  zoomIn: { display: [MOD_DISPLAY, '+'], aria: `${MOD_ARIA}+=`, label: 'Zoom in' },
  zoomOut: { display: [MOD_DISPLAY, '−'], aria: `${MOD_ARIA}+-`, label: 'Zoom out' },
  resetView: { display: [MOD_DISPLAY, '0'], aria: `${MOD_ARIA}+0`, label: 'Reset view' },

  // Orientation (matches constants/orientationViews.ts)
  viewFront: { display: ['F'], aria: 'F', label: 'Front view' },
  viewLeft: { display: ['L'], aria: 'L', label: 'Left view' },
  viewRight: { display: ['R'], aria: 'R', label: 'Right view' },
  viewSide: { display: ['S'], aria: 'S', label: 'Side view' },
  viewBack: { display: ['B'], aria: 'B', label: 'Back view' },
  viewTop: { display: ['T'], aria: 'T', label: 'Top view' },
  viewBottom: { display: ['⇧', 'B'], aria: 'Shift+B', label: 'Bottom view' },

  // Auto-rotation
  autoRotate: { display: ['Space'], aria: 'Space', label: 'Toggle auto-rotation' },
} as const satisfies Record<string, ShortcutInfo>

export type ShortcutId = keyof typeof SHORTCUTS

export const formatShortcut = (id: ShortcutId): string => SHORTCUTS[id].display.join(' + ')
