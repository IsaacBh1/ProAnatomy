import { ArrowsClockwise, Pause } from '@phosphor-icons/react'
import { Pill, Tooltip } from '@/components/ui'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { ORIENTATION_VIEWS } from '../constants/orientationViews'
import { SHORTCUTS, formatShortcut, type ShortcutId } from '../constants/shortcuts'
import { useCameraStore } from '../store/cameraStore'
import type { StandardView } from '../types/camera'

const BUTTON_CLASS = cn(
  'grid size-8 shrink-0 place-items-center rounded-full text-base leading-none text-content transition-colors',
  'hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-muted',
)

/** Map from StandardView id to its shortcut id. Kept as a lookup so the JSX stays flat. */
const VIEW_SHORTCUT: Record<StandardView, ShortcutId> = {
  front: 'viewFront',
  back: 'viewBack',
  left: 'viewLeft',
  right: 'viewRight',
  side: 'viewSide',
  top: 'viewTop',
  bottom: 'viewBottom',
}

interface OrientationButtonProps {
  label: string
  name: string
  shortcutId: ShortcutId
  onClick: () => void
}

function OrientationButton({ label, name, shortcutId, onClick }: OrientationButtonProps) {
  const info = SHORTCUTS[shortcutId]
  return (
    <Tooltip label={name} shortcut={formatShortcut(shortcutId)} side="left">
      <button
        type="button"
        aria-label={name}
        aria-keyshortcuts={info.aria}
        onClick={onClick}
        className={BUTTON_CLASS}
      >
        {label}
      </button>
    </Tooltip>
  )
}

interface AutoRotateButtonProps {
  active: boolean
  onToggle: () => void
}

function AutoRotateButton({ active, onToggle }: AutoRotateButtonProps) {
  const info = SHORTCUTS.autoRotate
  const label = active ? 'Pause rotation' : 'Auto-rotate'
  return (
    <Tooltip label={label} shortcut={formatShortcut('autoRotate')} side="left">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        aria-keyshortcuts={info.aria}
        onClick={onToggle}
        className={cn(BUTTON_CLASS, active && 'bg-surface-raised')}
      >
        {active ? <Pause size={16} aria-hidden /> : <ArrowsClockwise size={16} aria-hidden />}
      </button>
    </Tooltip>
  )
}

/**
 * Vertical camera-orientation bar. Owns nothing: it reads the camera API and the auto-rotate
 * flag, and dispatches to them. Adding a view = one entry in ORIENTATION_VIEWS + one branch in
 * the shortcut handler.
 */
export function ViewBar() {
  const camera = useCameraStore((state) => state.api)
  const autoRotate = useUiStore((state) => state.autoRotate)
  const toggleAutoRotate = useUiStore((state) => state.toggleAutoRotate)

  const goTo = (view: StandardView) => camera?.setStandardView(view)

  return (
    <Pill
      role="toolbar"
      aria-label="Camera orientation"
      className="flex-col gap-0.5 overflow-visible rounded-[46px] p-[5px]"
    >
      {ORIENTATION_VIEWS.map(({ id, label, name }) => (
        <OrientationButton
          key={id}
          label={label}
          name={name}
          shortcutId={VIEW_SHORTCUT[id]}
          onClick={() => goTo(id)}
        />
      ))}
      <AutoRotateButton active={autoRotate} onToggle={toggleAutoRotate} />
    </Pill>
  )
}
