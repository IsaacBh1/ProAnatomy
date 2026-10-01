import type { RequestHandler } from 'express'
import { env } from '../../env'
import { AppError } from '../http/errors'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Belt-and-braces for state-changing requests.
 *
 * The refresh cookie already uses SameSite=Strict, which blocks cross-site
 * form submissions in every modern browser. This middleware catches the cases
 * SameSite doesn't cover: a future change that loosens it, a browser with a
 * SameSite bug, and anything reading this code and assuming it's protected.
 *
 * Rule: if an Origin header is present, it must be in CORS_ORIGINS. If it is
 * absent, the request is allowed — blocking on absence would break curl,
 * server-to-server callers, and React Native.
 */
export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()

  const origin = req.header('origin')
  if (!origin || env.CORS_ORIGINS.includes(origin)) return next()

  next(
    new AppError({
      status: 403,
      code: 'forbidden',
      message: 'Request origin is not allowed.',
    }),
  )
}
