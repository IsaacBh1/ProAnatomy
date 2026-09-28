import { Moon, Sun } from '@phosphor-icons/react'
import { Tooltip } from '@/components/ui'
import { useResolvedTheme } from '@/hooks/useTheme'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/utils/cn'

/**
 * Flips between dark and light. Cycling to 'system' is not exposed here on purpose: an
 * explicit two-way switch is what users expect from a single button. If you later want a
 * three-way choice, replace this with a Select bound to `useThemeStore.setPreference`.
 */
export function ThemeToggle() {
  const resolved = useResolvedTheme()
  const toggle = useThemeStore((state) => state.toggle)

  const target = resolved === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${target} theme`

  return (
    <Tooltip label={label} shortcut="Ctrl + J" side="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={resolved === 'light'}
        aria-keyshortcuts="Control+J Meta+J"
        onClick={toggle}
        className={cn(
          'grid size-8 place-items-center rounded-full text-content transition-colors',
          'hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-muted',
        )}
      >
        {resolved === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      </button>
    </Tooltip>
  )
}
