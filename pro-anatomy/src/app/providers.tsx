import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useCustomPresetsStore } from '@/features/anatomy/store/customPresetsStore'
import { useAuthStore } from '@/features/auth'
import { useNotesStore } from '@/features/notes/store/notesStore'
import { queryClient } from '@/lib/query/client'
import { useApplyTheme } from '@/hooks/useTheme'

function ThemeEffect() {
  useApplyTheme()
  return null
}

/**
 * Boot sequence.
 *
 *  1. Read the session first — a `POST /auth/refresh` against the httpOnly
 *     cookie. If it succeeds we have a fresh access token and a user.
 *  2. Only then load account-scoped data. Doing it in parallel would fire
 *     two authenticated requests with no token and two 401s.
 *  3. On sign-out, reset both stores so the sidebar cannot leak the previous
 *     user's notes or presets.
 */
function Bootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const authReady = useAuthStore((s) => s.ready)

  useEffect(() => {
    void useAuthStore.getState().load()
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (userId) {
      void useNotesStore.getState().load()
      void useCustomPresetsStore.getState().load()
    } else {
      useNotesStore.getState().reset()
      useCustomPresetsStore.getState().reset()
    }
  }, [authReady, userId])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffect />
      <Bootstrap />
      {children}
    </QueryClientProvider>
  )
}
