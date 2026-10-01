import type { CookieOptions, Response } from 'express'
import { env } from '../../env'

const COOKIE_NAME = 'pa_refresh'
const COOKIE_PATH = '/api/auth'

/**
 * `sameSite` is the one that catches people out.
 *
 * `'strict'` (the dev default) means the browser will not attach the cookie to
 * any cross-site request — including the `fetch()` your Vercel frontend makes
 * to your Render backend. Login still appears to work because the Set-Cookie
 * header is honoured; every subsequent refresh 401s.
 *
 * Cross-site deployments must set COOKIE_SAME_SITE=none. The browser then
 * requires `Secure`, which is on in production (both platforms serve HTTPS).
 * CSRF is handled by `originCheck`, not by SameSite.
 */
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.COOKIE_SAME_SITE,
  path: COOKIE_PATH,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(COOKIE_NAME, token, { ...baseOptions, expires: expiresAt })
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, baseOptions)
}

export function readRefreshCookie(cookies: Record<string, unknown> | undefined): string | null {
  const value = cookies?.[COOKIE_NAME]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export const REFRESH_COOKIE_NAME = COOKIE_NAME
