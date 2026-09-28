import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'

const QUERY = '(prefers-color-scheme: dark)'

/** Live view of the OS setting. Re-renders on change even when the app is on 'system'. */
function useSystemPrefersDark(): boolean {
  const [dark, setDark] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return dark
}

/** The theme actually on screen: 'dark' or 'light'. Never 'system'. */
export function useResolvedTheme(): 'dark' | 'light' {
  const preference = useThemeStore((state) => state.preference)
  const systemPrefersDark = useSystemPrefersDark()

  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/**
 * Applies the resolved theme to <html data-theme>. Runs at the top of the tree, once.
 * The same attribute is set before React mounts by the inline script in index.html, so the
 * first paint already has the right palette.
 */
export function useApplyTheme(): void {
  const resolved = useResolvedTheme()

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])
}
