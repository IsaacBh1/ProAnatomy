import rateLimit, { type Options } from 'express-rate-limit'
import type { Request } from 'express'
import { env } from '../../env'

/**
 * NOTE ON THE STORE
 * -----------------
 * express-rate-limit defaults to an in-memory store. That is correct for
 * development and for a single-instance deployment, and wrong for anything
 * behind a load balancer: each instance keeps its own counters, so the real
 * limit is (configured limit × instance count).
 *
 * When you scale out, install `rate-limit-redis` and pass a `store` here.
 * Everything else in this file stays the same.
 */

const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Match the app's own trust-proxy setting. express-rate-limit refuses to
  // guess, because a wrong guess lets an attacker spoof req.ip via X-F-F.
  validate: { trustProxy: false },
}

export const globalLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 300 : 10_000,
  // Health probes run every few seconds from the orchestrator. They must not
  // count against the bucket a real user shares.
  skip: (req) => req.originalUrl.startsWith('/api/health'),
  message: { error: { code: 'rate_limited', message: 'Too many requests. Slow down.' } },
})

const credentialKey = (req: Request): string => {
  const email =
    req.body && typeof req.body === 'object' && 'email' in req.body
      ? String((req.body as { email: unknown }).email).toLowerCase().slice(0, 200)
      : ''
  return `${req.ip ?? 'unknown'}:${email}`
}

/**
 * Keyed on (IP, email) so a single attacker cannot lock out a victim's account
 * from a different IP. `skipSuccessfulRequests` means only failures count:
 * a user who signs in 20 times a day is never throttled, but 10 wrong guesses
 * against one address from one address is.
 */
export const credentialLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 10 : 100,
  keyGenerator: credentialKey,
  skipSuccessfulRequests: true,
  message: {
    error: { code: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' },
  },
})

/**
 * Signup is deliberately stricter and does NOT skip successes.
 *
 * The credential limiter above only throttles failed logins, which means an
 * attacker with a list of 10,000 fresh emails can create 10,000 accounts from
 * one machine without ever tripping it. Capping account creation per IP closes
 * that hole. The limit is generous enough for a shared office or a NAT.
 */
export const signupLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: env.isProduction ? 5 : 100,
  message: {
    error: { code: 'rate_limited', message: 'Too many accounts from this address. Try again later.' },
  },
})

export const refreshLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 60 : 600,
  message: { error: { code: 'rate_limited', message: 'Too many refresh attempts.' } },
})
