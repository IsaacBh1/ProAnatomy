import type { RequestHandler } from 'express'
import { prisma } from '../db/prisma'
import { unauthorized } from '../http/errors'
import { verifyAccessToken } from '../security/tokens'

export interface AuthContext {
  userId: string
  sessionId: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

function readBearer(header: string | undefined): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1]?.trim() ?? null
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readBearer(req.header('authorization'))
    if (!token) throw unauthorized()

    const claims = await verifyAccessToken(token)
    if (!claims) throw unauthorized()

    const session = await prisma.session.findUnique({
      where: { id: claims.sid },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true },
    })

    if (!session) throw unauthorized('session_revoked', 'Your session is no longer valid.')
    if (session.revokedAt) throw unauthorized('session_revoked', 'Your session was revoked.')
    if (session.expiresAt.getTime() <= Date.now())
      throw unauthorized('session_revoked', 'Your session has expired.')
    if (session.userId !== claims.sub) throw unauthorized()

    req.auth = { userId: session.userId, sessionId: session.id }
    next()
  } catch (err) {
    next(err)
  }
}

export function getAuth(req: { auth?: AuthContext }): AuthContext {
  if (!req.auth) {
    throw new Error('getAuth() called on a route that is not behind requireAuth')
  }
  return req.auth
}
