import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  BookmarkSimple,
  CornersOut,
  Crosshair,
  Eye,
  EyeSlash,
  NotePencil,
  Tag,
  TagChevron,
  X,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/utils/cn'
import { addNoteForSelection } from '@/features/notes/services/noteCommands'
import { SHORTCUTS, formatShortcut, type ShortcutId } from '../constants/shortcuts'
import {
  clearSelection,
  focusOnPart,
  hideParts,
  isolatePart,
  restoreAll,
} from '../services/viewCommands'
import { useContextMenuStore } from '../store/contextMenuStore'
import { usePresetDraftStore } from '../store/presetDraftStore'
import { useSelectionStore } from '@/store/selectionStore'
import { useUiStore } from '@/store/uiStore'
import { useViewStore } from '../store/viewStore'

const EDGE_MARGIN = 8

interface MenuItemDef {
  id: string
  label: string
  icon: Icon
  run: () => void
  shortcutId?: ShortcutId
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuItemProps {
  item: MenuItemDef
  onChosen: () => void
}

function ContextMenuItem({ item, onChosen }: ContextMenuItemProps) {
  const shortcut = item.shortcutId ? formatShortcut(item.shortcutId) : null
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      aria-keyshortcuts={item.shortcutId ? SHORTCUTS[item.shortcutId].aria : undefined}
      onClick={() => {
        item.run()
        onChosen()
      }}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-content',
        'hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      <item.icon size={16} aria-hidden className="shrink-0 text-muted" />
      <span className="flex-1 truncate">{item.label}</span>
      {shortcut && (
        <kbd className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-muted">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

/**
 * Part actions on right-click. The first item toggles a callout, then the viewer commands.
 * Positioned relative to the nearest positioned ancestor (the viewer container), clamped so
 * it never runs off an edge.
 */
export function ViewerContextMenu() {
  const target = useContextMenuStore((s) => s.target)
  const close = useContextMenuStore((s) => s.close)
  const hiddenCount = useViewStore((s) => s.hiddenIds.size)
  const hasSelection = useSelectionStore((s) => s.selectedIds.size > 0)
  const calloutIds = useUiStore((s) => s.calloutIds)
  const ref = useRef<HTMLDivElement>(null)

  // Clamp inside the positioned parent. Runs before paint, so the un-clamped position never
  // shows even for one frame.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !target) return

    const parent = el.offsetParent as HTMLElement | null
    const parentW = parent?.clientWidth ?? window.innerWidth
    const parentH = parent?.clientHeight ?? window.innerHeight
    const maxX = Math.max(EDGE_MARGIN, parentW - el.offsetWidth - EDGE_MARGIN)
    const maxY = Math.max(EDGE_MARGIN, parentH - el.offsetHeight - EDGE_MARGIN)
    el.style.left = `${Math.min(Math.max(target.x, EDGE_MARGIN), maxX)}px`
    el.style.top = `${Math.min(Math.max(target.y, EDGE_MARGIN), maxY)}px`
  }, [target])

  // Escape (captured, so it beats the global shortcut handler) or any meaningful key closes the
  // menu; so does a click outside.
  useEffect(() => {
    if (!target) return

    const isModifier = (key: string) =>
      key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      } else if (!isModifier(event.key)) {
        close()
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }

    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [target, close])

  if (!target) return null

  const hasCallout = calloutIds.has(target.partId)
  const calloutLabel = hasCallout ? 'Remove callout' : 'Add callout'

  const items: MenuItemDef[] = [
    {
      id: 'callout',
      label: calloutLabel,
      icon: hasCallout ? TagChevron : Tag,
      shortcutId: 'callout',
      run: () => useUiStore.getState().toggleCallout(target.partId),
    },
    {
      id: 'isolate',
      label: 'Isolate',
      icon: Crosshair,
      shortcutId: 'isolate',
      run: () => isolatePart(target.partId),
    },
    {
      id: 'focus',
      label: 'Focus camera',
      icon: CornersOut,
      run: () => focusOnPart(target.partId),
    },
    {
      id: 'note',
      label: 'Add note',
      icon: NotePencil,
      shortcutId: 'note',
      run: () => {
        // Right-clicking a part outside the current selection is a natural way to say
        // "note about *this* part", so target it if it isn't already selected.
        const selected = useSelectionStore.getState().selectedIds
        if (!selected.has(target.partId)) useSelectionStore.getState().setSelected([target.partId])
        addNoteForSelection()
      },
    },
    {
      id: 'preset',
      label: 'Save selection as preset',
      icon: BookmarkSimple,
      shortcutId: 'preset',
      run: () => {
        const selected = useSelectionStore.getState().selectedIds
        const ids = selected.has(target.partId) ? [...selected] : [target.partId]
        usePresetDraftStore.getState().openNaming(ids)
      },
    },
    {
      id: 'hide',
      label: 'Hide',
      icon: EyeSlash,
      shortcutId: 'hide',
      run: () => hideParts([target.partId]),
    },
    {
      id: 'restore',
      label: 'Restore all',
      icon: Eye,
      shortcutId: 'restore',
      disabled: hiddenCount === 0,
      divider: true,
      run: restoreAll,
    },
    {
      id: 'clear',
      label: 'Clear selection',
      icon: X,
      shortcutId: 'clear',
      disabled: !hasSelection,
      run: clearSelection,
    },
  ]

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Part actions"
      className="absolute z-50 min-w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-2xl"
      style={{ left: target.x, top: target.y }}
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.divider && <div role="separator" className="my-1 h-px bg-border" />}
          <ContextMenuItem item={item} onChosen={close} />
        </div>
      ))}
    </div>
  )
}
