import { useEffect, useState } from 'react'

/**
 * Live media-query subscription. SSR-safe (returns `false` on the server).
 *
 * We read the initial value lazily so the first paint is correct on the client,
 * then subscribe for changes. The effect also re-syncs once, in case the query
 * changed between render and commit.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Shell breakpoint. Below this, panels are overlays; at or above, they dock.
 * md = 768px. One breakpoint for the whole shell, so it never disagrees with
 * itself.
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
