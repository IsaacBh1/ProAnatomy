// src/features/drawing/components/ViewerModeToggle.tsx
import { BookOpen, PaintBrush } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Button, Pill } from '@/components/ui'
import { useUiStore, type ViewerMode } from '@/store/uiStore'

const OPTIONS: readonly { value: ViewerMode; label: string; icon: Icon }[] = [
  { value: 'explore', label: 'Explore', icon: BookOpen },
  { value: 'draw', label: 'Draw', icon: PaintBrush },
]

export function ViewerModeToggle() {
  const mode = useUiStore((s) => s.viewerMode)
  const setMode = useUiStore((s) => s.setViewerMode)

  return (
    <Pill role="radiogroup" aria-label="Viewer mode">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          icon={Icon}
          role="radio"
          aria-checked={mode === value}
          active={mode === value}
          onClick={() => setMode(value)}
        >
          {label}
        </Button>
      ))}
    </Pill>
  )
}
