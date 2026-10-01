import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { env } from '../../env'
import { conflict, unauthorized } from '../../shared/http/errors'
import { hashPassword, verifyPassword } from '../../shared/security/password'
import {
  generateRefreshToken,
  hashRefreshToken,
  newFamilyId,
  safeEqualHex,
  signAccessToken,
} from '../../shared/security/tokens'
import { toUserDto } from '../users/users.service'
import type { LoginInput, SignupInput } from './auth.schemas'
import type { AuthResult, AuthTokens, RequestContext } from './auth.types'

const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * How many live sessions one account may hold at once. Ten is generous for a
 * person (laptop, phone, tablet, a couple of browsers) and small enough that a
 * stolen session is eventually evicted by the user simply signing in from
 * somewhere else.
 */
const MAX_SESSIONS_PER_USER = 10

/**
 * Either the global Prisma client or a transaction client. Passing the right
 * one matters: inside `refresh()` we are already in a transaction, and reading
 * outside it would see stale rows.
 */
type Db = PrismaClient | Prisma.TransactionClient

async function enforceSessionCap(userId: string, db: Db): Promise<void> {
  const active = await db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'asc' },
    select: { id: true },
  })

  const overage = active.length - MAX_SESSIONS_PER_USER + 1
  if (overage <= 0) return

  await db.session.updateMany({
    where: { id: { in: active.slice(0, overage).map((s) => s.id) } },
    data: { revokedAt: new Date() },
  })
}

async function createSession(
  userId: string,
  ctx: RequestContext,
  db: Db = prisma,
  familyId: string = newFamilyId(),
): Promise<{ tokens: AuthTokens; sessionId: string }> {
  await enforceSessionCap(userId, db)

  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

  const session = await db.session.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      expiresAt,
    },
    select: { id: true },
  })

  const accessToken = await signAccessToken({ sub: userId, sid: session.id })

  return {
    sessionId: session.id,
    tokens: { accessToken, refreshToken, refreshExpiresAt: expiresAt },
  }
}

export async function signup(input: SignupInput, ctx: RequestContext): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password)

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })
  if (existing) throw conflict('email_taken', 'An account with that email already exists.')

  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  const { tokens } = await createSession(user.id, ctx)
  return { user: toUserDto(user), tokens }
}

/**
 * Computed once at module load. Used when a login is attempted for an email
 * that doesn't exist, so the response time doesn't reveal whether an account
 * is registered.
 */
const DUMMY_HASH = await hashPassword('enumeration-mitigation-placeholder')

export async function login(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true, createdAt: true, passwordHash: true },
  })

  const ok = user
    ? await verifyPassword(input.password, user.passwordHash)
    : ((await verifyPassword(input.password, DUMMY_HASH)), false)

  if (!user || !ok) {
    throw unauthorized('invalid_credentials', 'Email or password is incorrect.')
  }

  const { tokens } = await createSession(user.id, ctx)
  return { user: toUserDto(user), tokens }
}

export async function refresh(
  presentedToken: string,
  ctx: RequestContext,
): Promise<AuthResult & { tokens: AuthTokens }> {
  const tokenHash = hashRefreshToken(presentedToken)

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      familyId: true,
      revokedAt: true,
      expiresAt: true,
      tokenHash: true,
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
  })

  if (!session) {
    throw unauthorized('invalid_refresh_token', 'Your session has expired. Please sign in again.')
  }

  if (!safeEqualHex(session.tokenHash, tokenHash)) {
    throw unauthorized('invalid_refresh_token', 'Your session has expired. Please sign in again.')
  }

  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    throw unauthorized('session_revoked', 'Your session was revoked. Please sign in again.')
  }

  const { tokens } = await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    })
    return createSession(session.userId, ctx, tx, session.familyId)
  })

  return { user: toUserDto(session.user), tokens }
}

export async function logout(presentedToken: string | null): Promise<void> {
  if (!presentedToken) return
  const tokenHash = hashRefreshToken(presentedToken)
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function pruneExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  })
  return count
}
