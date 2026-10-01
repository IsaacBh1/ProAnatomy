// src/features/auth/components/AuthGuards.tsx
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Rendered while the session is being read from storage. Reading is effectively
 * instant, but a `ready` gate avoids a flash of the login page on reload for an
 * already-signed-in user.
 */
function Splash() {
  return <div className="min-h-dvh bg-canvas" />
}

/** Blocks a route until the user is signed in, remembering where they came from. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const ready = useAuthStore((s) => s.ready)
  const location = useLocation()

  if (!ready) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** Keeps a signed-in user away from the login and signup pages. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const ready = useAuthStore((s) => s.ready)

  if (!ready) return <Splash />
  if (user) return <Navigate to="/anatomy" replace />
  return <>{children}</>
}
