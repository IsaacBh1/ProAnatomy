import type { Request, RequestHandler } from 'express'
import { unauthorized } from '../../shared/http/errors'
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../../shared/security/cookies'
import { getAuth } from '../../shared/middleware/require-auth'
import { toUserDto, findUserById } from '../users/users.service'
import type { LoginInput, SignupInput } from './auth.schemas'
import * as authService from './auth.service'
import type { RequestContext } from './auth.types'

function contextFrom(req: Request): RequestContext {
  return {
    userAgent: req.header('user-agent')?.slice(0, 500) ?? null,
    ip: req.ip ?? null,
  }
}

export const signup: RequestHandler = async (req, res) => {
  const input = req.body as SignupInput
  const { user, tokens } = await authService.signup(input, contextFrom(req))
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt)
  res.status(201).json({ user, accessToken: tokens.accessToken })
}

export const login: RequestHandler = async (req, res) => {
  const input = req.body as LoginInput
  const { user, tokens } = await authService.login(input, contextFrom(req))
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt)
  res.json({ user, accessToken: tokens.accessToken })
}

export const refresh: RequestHandler = async (req, res) => {
  const presented = readRefreshCookie(req.cookies as Record<string, unknown> | undefined)
  if (!presented) {
    clearRefreshCookie(res)
    throw unauthorized('invalid_refresh_token', 'Your session has expired. Please sign in again.')
  }

  const { user, tokens } = await authService.refresh(presented, contextFrom(req))
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt)
  res.json({ user, accessToken: tokens.accessToken })
}

export const logout: RequestHandler = async (req, res) => {
  const presented = readRefreshCookie(req.cookies as Record<string, unknown> | undefined)
  await authService.logout(presented)
  clearRefreshCookie(res)
  res.status(204).end()
}

/**
 * Sign out of every device. Requires a valid access token (so an attacker
 * with a stolen refresh cookie alone cannot use this to log the user out —
 * a nuisance attack, but a cheap one to prevent).
 */
export const logoutAll: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  await authService.logoutAll(userId)
  clearRefreshCookie(res)
  res.status(204).end()
}

export const me: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const user = await findUserById(userId)
  if (!user) throw unauthorized('session_revoked', 'Your account no longer exists.')
  res.json({ user: toUserDto(user) })
}
