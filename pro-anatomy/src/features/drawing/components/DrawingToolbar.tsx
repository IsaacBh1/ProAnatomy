// src/features/drawing/components/DrawingToolbar.tsx
import {
  PaintBrush,
  Eraser,
  Minus,
  ArrowRight,
  Rectangle,
  Circle,
  TextT,
  ArrowUUpLeft,
  ArrowUUpRight,
  Trash,
  Camera,
  Cube,
  Square,
  Hand,
  MagnifyingGlassPlus,
  VectorThreeIcon,
  Selection,
  PenNib,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Button, Pill, Tooltip } from '@/components/ui'
import { openSnapshot } from '@/features/anatomy/services/viewCommands'
import { useUiStore, type DrawingSpace } from '@/store/uiStore'
import {
  CAMERA_TOOLS,
  DRAWING_TOOLS,
  EDIT_TOOLS,
  SELECTION_TOOLS,
  SURFACE_TOOLS,
} from '../constants'
import { useDrawingStore } from '../store/drawingStore'
import type { ToolId } from '../types'
import { cn } from '@/utils/cn'

const ICONS: Record<ToolId, Icon> = {
  orbit: VectorThreeIcon,
  zoom: MagnifyingGlassPlus,
  pan: Hand,
  select: Selection,
  edit: PenNib,
  brush: PaintBrush,
  eraser: Eraser,
  line: Minus,
  arrow: ArrowRight,
  rect: Rectangle,
  ellipse: Circle,
  text: TextT,
}

const SPACES: readonly { id: DrawingSpace; label: string; icon: Icon; hint: string }[] = [
  { id: 'screen', label: 'Screen', icon: Square, hint: 'Draw flat annotations over the view' },
  { id: 'surface', label: 'Surface', icon: Cube, hint: 'Draw on the model — sticks as you rotate' },
]

interface ToolButtonProps {
  id: ToolId
  label: string
  shortcut: string
  active: boolean
  dimmed?: boolean
  onClick: () => void
}

function ToolButton({ id, label, shortcut, active, dimmed, onClick }: ToolButtonProps) {
  return (
    <Tooltip label={label} shortcut={shortcut || undefined} side="bottom">
      <Button
        icon={ICONS[id]}
        active={active}
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cn(dimmed && 'opacity-40')}
      >
        {active ? label.toLowerCase() : null}
      </Button>
    </Tooltip>
  )
}

export function DrawingToolbar() {
  const tool = useDrawingStore((s) => s.tool)
  const setTool = useDrawingStore((s) => s.setTool)
  const undo = useDrawingStore((s) => s.undo)
  const redo = useDrawingStore((s) => s.redo)
  const clear = useDrawingStore((s) => s.clear)
  const canUndo = useDrawingStore((s) => s.past.length > 0)
  const canRedo = useDrawingStore((s) => s.future.length > 0)
  const elementCount = useDrawingStore((s) => s.elements.length + s.surfaceStrokes.length)

  const drawingSpace = useUiStore((s) => s.drawingSpace)
  const setDrawingSpace = useUiStore((s) => s.setDrawingSpace)

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <Pill role="radiogroup" aria-label="Drawing space" className="overflow-visible">
        {SPACES.map(({ id, label, icon: Icon, hint }) => {
          const active = drawingSpace === id
          return (
            <Tooltip key={id} label={hint} side="bottom">
              <Button
                icon={Icon}
                role="radio"
                aria-checked={active}
                aria-label={`${label} drawing`}
                active={active}
                onClick={() => setDrawingSpace(id)}
              >
                {active ? label.toLowerCase() : null}
              </Button>
            </Tooltip>
          )
        })}
      </Pill>

      <Pill role="toolbar" aria-label="Drawing tools" className="overflow-visible">
        {CAMERA_TOOLS.map(({ id, label, key }) => (
          <ToolButton
            key={id}
            id={id}
            label={label}
            shortcut={key}
            active={tool === id}
            onClick={() => setTool(id)}
          />
        ))}

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        {/* Pick group: Select (organs) + Edit (drawn elements). */}
        {SELECTION_TOOLS.map(({ id, label, key }) => (
          <ToolButton
            key={id}
            id={id}
            label={label}
            shortcut={key}
            active={tool === id}
            onClick={() => setTool(id)}
          />
        ))}
        {EDIT_TOOLS.map(({ id, label, key }) => (
          <ToolButton
            key={id}
            id={id}
            label={label}
            shortcut={key}
            active={tool === id}
            onClick={() => setTool(id)}
          />
        ))}

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        {/* Create group. Dimmed when the tool can't act in the current space. */}
        {DRAWING_TOOLS.map(({ id, label, key }) => (
          <ToolButton
            key={id}
            id={id}
            label={label}
            shortcut={key}
            active={tool === id}
            dimmed={drawingSpace === 'surface' && !SURFACE_TOOLS.has(id)}
            onClick={() => setTool(id)}
          />
        ))}

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        <Tooltip label="Screenshot" shortcut="Ctrl + S" side="bottom">
          <Button icon={Camera} aria-label="Capture screenshot" onClick={openSnapshot} />
        </Tooltip>
        <Tooltip label="Undo" shortcut="Ctrl + Z" side="bottom">
          <Button icon={ArrowUUpLeft} aria-label="Undo" disabled={!canUndo} onClick={undo} />
        </Tooltip>
        <Tooltip label="Redo" shortcut="Ctrl + Y" side="bottom">
          <Button icon={ArrowUUpRight} aria-label="Redo" disabled={!canRedo} onClick={redo} />
        </Tooltip>
        <Tooltip label={`Clear drawings (${elementCount})`} side="bottom">
          <Button
            icon={Trash}
            aria-label="Clear drawings"
            disabled={elementCount === 0}
            onClick={clear}
          />
        </Tooltip>
      </Pill>
    </div>
  )
}
