import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { env } from '../../env'

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)

export interface AccessTokenClaims {
  sub: string
  sid: string
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ sid: claims.sid })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(accessSecret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, { algorithms: ['HS256'] })
    return claimsFromPayload(payload)
  } catch {
    return null
  }
}

function claimsFromPayload(payload: JWTPayload): AccessTokenClaims | null {
  const sub = payload.sub
  const sid = payload.sid
  if (typeof sub !== 'string' || typeof sid !== 'string') return null
  return { sub, sid }
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

const pepper = new TextEncoder().encode(env.REFRESH_TOKEN_PEPPER)

export function hashRefreshToken(token: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex')
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

export function newFamilyId(): string {
  return randomUUID()
}
