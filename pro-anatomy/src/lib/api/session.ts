import { config } from '@/app/config'
import type { User } from '@/features/auth/types'
import { ApiError, type ApiErrorBody, type ApiFieldError } from './errors'


interface AuthResponse {
  user: User
  accessToken: string
}

export interface Session {
  user: User
  accessToken: string
}


let currentSession: Session | null = null
const sessionListeners = new Set<(session: Session | null) => void>()

function setSession(next: Session | null): void {
  currentSession = next
  for (const listener of sessionListeners) listener(next)
}

export function getSession(): Session | null {
  return currentSession
}

export function subscribeSession(listener: (session: Session | null) => void): () => void {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}


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


interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
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
    credentials: 'include',
  })
}

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

let refreshPromise: Promise<Session | null> | null = null

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

  refreshPromise.finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}


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
    setSession(null)
  }
}
