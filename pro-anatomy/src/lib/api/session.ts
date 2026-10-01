// src/lib/api/session.ts
import { config } from '@/app/config'
import type { User } from '@/features/auth/types'
import { ApiError, type ApiErrorBody, type ApiFieldError } from './errors'

/**
 * One place that owns the access token and knows how to refresh it.
 *
 * Why the token lives here and not in a store:
 *   - it is a secret, so it should sit as close to the fetch call as possible;
 *   - it is 15-minute-lived, so persisting it would only widen the window an
 *     XSS could impersonate the user.
 *
 * Why we never touch localStorage for auth:
 *   The credential that actually mints sessions — the refresh token — is an
 *   httpOnly cookie set by the API. JavaScript cannot read it, cannot exfiltrate
 *   it, and cannot replay it from another origin. Trading a silent round-trip on
 *   boot for that property is the whole point.
 */

interface AuthResponse {
  user: User
  accessToken: string
}

export interface Session {
  user: User
  accessToken: string
}

// ─── State ───────────────────────────────────────────────────────────────

let currentSession: Session | null = null
const sessionListeners = new Set<(session: Session | null) => void>()

function setSession(next: Session | null): void {
  currentSession = next
  for (const listener of sessionListeners) listener(next)
}

export function getSession(): Session | null {
  return currentSession
}

/** Fires on every login, refresh and logout. */
export function subscribeSession(listener: (session: Session | null) => void): () => void {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

// ─── Error parsing ───────────────────────────────────────────────────────

async function toApiError(response: Response): Promise<ApiError> {
  let code = 'internal_error'
  let message = response.statusText || 'Request failed.'
  let details: readonly ApiFieldError[] | undefined

  try {
    const body = (await response.json()) as ApiErrorBody | null
    if (body?.error) {
      if (typeof body.error.code === 'string') code = body.error.code
      if (typeof body.error.message === 'string') message = body.error.message
      if (Array.isArray(body.error.details)) details = body.error.details
    }
  } catch {
    // Non-JSON body (proxy error page, offline). Keep the defaults.
  }

  return new ApiError(response.status, code, message, details)
}

// ─── Fetch with bearer + cookies ─────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Serialised to JSON as the request body. Omit for GET / DELETE. */
  body?: unknown
  /** Do not attempt refresh-and-retry on 401. Set for /auth/* calls. */
  skipRefresh?: boolean
}

async function rawRequest(path: string, init: RequestOptions): Promise<Response> {
  const url = path.startsWith('http')
    ? path
    : `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = currentSession?.accessToken
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...init,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    // The refresh cookie is path-scoped to /api/auth, so it is only ever sent
    // on those routes. `include` is simply the flag that lets a cross-origin
    // request set and receive cookies at all.
    credentials: 'include',
  })
}

/**
 * Authenticated fetch. Adds the bearer, sends cookies, and on 401 tries one
 * silent refresh before propagating the failure.
 */
export async function apiRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
  let response = await rawRequest(path, init)

  if (response.status === 401 && !init.skipRefresh) {
    try {
      const refreshed = await refreshSession()
      if (refreshed) response = await rawRequest(path, init)
    } catch {
      // Refresh failed at the network layer — surface the original 401 instead.
    }
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// ─── Refresh (single-flight) ─────────────────────────────────────────────
//
// The API rotates the refresh cookie on every call. Two concurrent refreshes
// would race: the second one presents a cookie the first has already burned.
// Every caller for the duration of one in-flight request shares this promise.

let refreshPromise: Promise<Session | null> | null = null

/**
 * Exchange the httpOnly refresh cookie for a fresh access token.
 *
 *   - resolves with the session on success,
 *   - resolves with null when there is no valid cookie (signed out) — this is
 *     a normal state, not an error,
 *   - rejects only when the network itself failed.
 */
export function refreshSession(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const response = await rawRequest('/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    })

    if (response.status === 401) {
      setSession(null)
      return null
    }
    if (!response.ok) throw await toApiError(response)

    const data = (await response.json()) as AuthResponse
    const session: Session = { user: data.user, accessToken: data.accessToken }
    setSession(session)
    return session
  })()

  // Clear the shared promise once it settles, pass or fail.
  refreshPromise.finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

// ─── Auth flows ──────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<Session> {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipRefresh: true,
  })
  const session: Session = { user: data.user, accessToken: data.accessToken }
  setSession(session)
  return session
}

export async function signUp(input: {
  name: string
  email: string
  password: string
}): Promise<Session> {
  const data = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: input,
    skipRefresh: true,
  })
  const session: Session = { user: data.user, accessToken: data.accessToken }
  setSession(session)
  return session
}

export async function signOut(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST', skipRefresh: true })
  } finally {
    // Local state is cleared even if the API call failed. The server-side
    // session will time out on its own.
    setSession(null)
  }
}
