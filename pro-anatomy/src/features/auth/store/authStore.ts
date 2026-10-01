// src/features/auth/store/authStore.ts
import { create } from 'zustand'
import { ApiError } from '@/lib/api/errors'
import {
  refreshSession,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  subscribeSession,
} from '@/lib/api/session'
import type { AuthError, AuthErrorCode, AuthResult, SignInInput, SignUpInput, User } from '../types'

interface AuthState {
  user: User | null
  /** True once the first `load()` has resolved, so guards can wait. */
  ready: boolean
  /** True while a sign-in or sign-up request is in flight. */
  pending: boolean

  load: () => Promise<void>
  signIn: (input: SignInInput) => Promise<AuthResult>
  signUp: (input: SignUpInput) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const KNOWN_AUTH_CODES = new Set<string>([
  'email_taken',
  'invalid_credentials',
  'invalid_email',
  'weak_password',
  'rate_limited',
  'validation_failed',
])

function toAuthError(error: unknown): AuthError {
  if (error instanceof ApiError) {
    const code: AuthErrorCode = KNOWN_AUTH_CODES.has(error.code)
      ? (error.code as AuthErrorCode)
      : 'unknown'
    return { code, message: error.message }
  }
  return { code: 'unknown', message: 'Something went wrong. Please try again.' }
}

// One-time cleanup. The pre-backend version of this app stored a PBKDF2-hashed
// password in localStorage. That data must not linger under a key that says
// "auth", even though nothing reads it any more.
try {
  localStorage.removeItem('pro-anatomy:auth:users')
  localStorage.removeItem('pro-anatomy:auth:session')
} catch {
  // Storage disabled or private mode. Nothing to clean.
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  ready: false,
  pending: false,

  load: async () => {
    try {
      const session = await refreshSession()
      set({ user: session?.user ?? null, ready: true })
    } catch {
      // Network failure, not a 401. Leave the app usable.
      set({ user: null, ready: true })
    }
  },

  signIn: async (input) => {
    if (get().pending) return { ok: false, error: { code: 'unknown', message: 'Please wait.' } }
    set({ pending: true })
    try {
      const session = await apiSignIn(input.email, input.password)
      set({ user: session.user })
      return { ok: true, user: session.user }
    } catch (error) {
      return { ok: false, error: toAuthError(error) }
    } finally {
      set({ pending: false })
    }
  },

  signUp: async (input) => {
    if (get().pending) return { ok: false, error: { code: 'unknown', message: 'Please wait.' } }
    set({ pending: true })
    try {
      const session = await apiSignUp(input)
      set({ user: session.user })
      return { ok: true, user: session.user }
    } catch (error) {
      return { ok: false, error: toAuthError(error) }
    } finally {
      set({ pending: false })
    }
  },

  signOut: async () => {
    try {
      await apiSignOut()
    } catch {
      // Offline / server down. The local state is cleared anyway so the user
      // is not stuck on a signed-in shell.
    } finally {
      set({ user: null })
    }
  },
}))

// The API client can rotate the token in the background (any 401 triggers a
// refresh). Keep the store's `user` in sync when that happens.
subscribeSession((session) => {
  useAuthStore.setState({ user: session?.user ?? null })
})
