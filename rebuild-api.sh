#!/usr/bin/env bash
set -euo pipefail

C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
C_BLUE=$'\033[1;34m'; C_GREEN=$'\033[1;32m'; C_RED=$'\033[1;31m'; C_YELLOW=$'\033[1;33m'
C_RESET=$'\033[0m'
log()  { printf '%s→%s %s\n' "$C_BLUE" "$C_RESET" "$*"; }
ok()   { printf '%s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
die()  { printf '%s✖%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

printf '\n%sProAnatomy API — Node rebuild%s\n\n' "$C_BOLD" "$C_RESET"

# ─── 0. Prerequisites ────────────────────────────────────────────────────────
log "Checking prerequisites"
command -v node   >/dev/null 2>&1 || die "Node.js is not installed. Install Node 20+ from https://nodejs.org"
command -v npm    >/dev/null 2>&1 || die "npm is not installed."
command -v docker >/dev/null 2>&1 || die "Docker is not installed."
docker compose version >/dev/null 2>&1 || die "'docker compose' (v2) is not available."
command -v openssl>/dev/null 2>&1 || die "openssl is not installed."

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 20 ] || die "Node 20+ required. You have $(node -v)."
ok "node $(node -v), npm $(npm -v)"

# ─── 1. Wipe and recreate ────────────────────────────────────────────────────
TARGET="pro-anatomy-api"
if [ -e "$TARGET" ]; then
  warn "Removing existing $TARGET/ …"
  rm -rf "$TARGET"
fi

mkdir -p "$TARGET"
cd "$TARGET"

mkdir -p prisma
mkdir -p src/shared/db src/shared/http src/shared/security src/shared/middleware
mkdir -p src/features/auth src/features/users src/features/notes src/features/presets src/features/health
ok "Directory layout created at $(pwd)"

# ─── 2. package.json ─────────────────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "pro-anatomy-api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch --env-file=.env src/server.ts",
    "start": "tsx --env-file=.env src/server.ts",
    "typecheck": "tsc --noEmit",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "@node-rs/argon2": "^2.0.2",
    "@prisma/client": "^6.5.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "jose": "^6.0.10",
    "pino": "^9.6.0",
    "pino-http": "^10.4.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.0",
    "pino-pretty": "^13.0.0",
    "prisma": "^6.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.3"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > .gitignore << 'EOF'
node_modules/
.env
.env.*
!.env.example
dist/
*.log
.DS_Store
EOF

# ─── 3. docker-compose.yml ───────────────────────────────────────────────────
cat > docker-compose.yml << 'EOF'
services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: anatomist
      POSTGRES_PASSWORD: anatomist_dev_pw
      POSTGRES_DB: pro_anatomy
    ports:
      - "5432:5432"
    volumes:
      - pro_anatomy_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U anatomist -d pro_anatomy"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  pro_anatomy_pgdata:
EOF

# ─── 4. Prisma schema (v6 style — url lives here) ────────────────────────────
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid(7)) @db.Uuid
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sessions Session[]
  notes    Note[]
  presets  Preset[]

  @@map("users")
}

model Session {
  id     String @id @default(uuid(7)) @db.Uuid
  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  tokenHash String @unique
  familyId  String @db.Uuid

  userAgent String?
  ip        String?

  expiresAt  DateTime
  revokedAt  DateTime?
  lastUsedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([familyId])
  @@index([expiresAt])
  @@map("sessions")
}

model Note {
  id     String @id @default(uuid(7)) @db.Uuid
  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  title String @default("")
  body  String @default("")

  anchorKind String
  anchorIds  String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, updatedAt(sort: Desc)])
  @@map("notes")
}

model Preset {
  id     String @id @default(uuid(7)) @db.Uuid
  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name             String
  partIds          String[]
  createdPartCount Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, createdAt])
  @@map("presets")
}
EOF

# ─── 5. src/env.ts ───────────────────────────────────────────────────────────
cat > src/env.ts << 'EOF'
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be ≥ 32 chars'),
  REFRESH_TOKEN_PEPPER: z.string().min(32, 'REFRESH_TOKEN_PEPPER must be ≥ 32 chars'),

  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((raw) => raw.split(',').map((s) => s.trim()).filter(Boolean))
    .refine((origins) => !origins.includes('*'), {
      message: 'CORS_ORIGINS must list explicit origins; "*" is not allowed with credentials',
    }),

  COOKIE_DOMAIN: z.string().optional().transform((v) => v?.trim() || undefined),

  TRUST_PROXY: z
    .string()
    .default('0')
    .transform((v) => v === '1' || v === 'true')
    .pipe(z.boolean()),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('✖ Invalid environment configuration:\n')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  }
  console.error('\nCopy .env.example to .env and fill in the required values.')
  process.exit(1)
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
} as const

export type Env = typeof env
EOF

# ─── 6. src/shared/logger.ts ─────────────────────────────────────────────────
cat > src/shared/logger.ts << 'EOF'
import pino from 'pino'
import { env } from '../env'

export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      'tokenHash',
      '*.password',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
})
EOF

# ─── 7. src/shared/db/prisma.ts ──────────────────────────────────────────────
cat > src/shared/db/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import { env } from '../../env'
import { logger } from '../logger'

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient }

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.isProduction
      ? [{ emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  })

prisma.$on('error' as never, (e: unknown) => {
  logger.error({ prisma: e }, 'prisma error')
})

if (!env.isProduction) globalForPrisma.__prisma = prisma
EOF

# ─── 8. src/shared/http/errors.ts ────────────────────────────────────────────
cat > src/shared/http/errors.ts << 'EOF'
export type ErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'unauthorized'
  | 'invalid_refresh_token'
  | 'session_revoked'
  | 'validation_failed'
  | 'not_found'
  | 'forbidden'
  | 'payload_too_large'
  | 'rate_limited'
  | 'internal_error'

export interface FieldError {
  path: string
  message: string
}

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: readonly FieldError[]
  readonly expose: boolean

  constructor(opts: {
    status: number
    code: ErrorCode
    message: string
    details?: readonly FieldError[]
    expose?: boolean
  }) {
    super(opts.message)
    this.name = 'AppError'
    this.status = opts.status
    this.code = opts.code
    this.details = opts.details
    this.expose = opts.expose ?? true
  }
}

export const badRequest = (code: ErrorCode, message: string, details?: readonly FieldError[]) =>
  new AppError({ status: 400, code, message, details })

export const unauthorized = (code: ErrorCode = 'unauthorized', message = 'Authentication required.') =>
  new AppError({ status: 401, code, message })

export const forbidden = (message = 'You do not have access to that resource.') =>
  new AppError({ status: 403, code: 'forbidden', message })

export const notFound = (message = 'Not found.') =>
  new AppError({ status: 404, code: 'not_found', message })

export const conflict = (code: ErrorCode, message: string) =>
  new AppError({ status: 409, code, message })

export const internal = (message = 'Something went wrong.') =>
  new AppError({ status: 500, code: 'internal_error', message, expose: false })
EOF

# ─── 9. src/shared/http/error-handler.ts ─────────────────────────────────────
cat > src/shared/http/error-handler.ts << 'EOF'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { env } from '../../env'
import { logger } from '../logger'
import { AppError } from './errors'

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` },
  })
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = res.locals.requestId as string | undefined

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, requestId }, err.message)
    else logger.debug({ code: err.code, requestId }, err.message)

    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    })
    return
  }

  // Prisma 6: error classes live under the Prisma namespace.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { code: 'email_taken', message: 'An account with that email already exists.' },
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'not_found', message: 'Not found.' } })
      return
    }
  }

  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'payload_too_large', message: 'Request body is too large.' },
    })
    return
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'validation_failed', message: 'Request body is not valid JSON.' },
    })
    return
  }

  logger.error({ err, requestId, path: req.path, method: req.method }, 'unhandled error')

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: env.isProduction ? 'Something went wrong.' : String((err as Error)?.message ?? err),
    },
  })
}
EOF

# ─── 10. src/shared/http/validate.ts ─────────────────────────────────────────
cat > src/shared/http/validate.ts << 'EOF'
import type { RequestHandler } from 'express'
import { z, type ZodTypeAny } from 'zod'
import { AppError } from './errors'

interface Schemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const issues: Array<{ path: string; message: string }> = []

    for (const [part, schema] of Object.entries(schemas) as Array<
      [keyof Schemas, ZodTypeAny | undefined]
    >) {
      if (!schema) continue
      const result = schema.safeParse(req[part])
      if (result.success) {
        if (part === 'query') Object.defineProperty(req, 'validatedQuery', { value: result.data })
        else (req as unknown as Record<string, unknown>)[part] = result.data
      } else {
        for (const issue of result.error.issues) {
          issues.push({ path: issue.path.join('.') || part, message: issue.message })
        }
      }
    }

    if (issues.length > 0) {
      next(
        new AppError({
          status: 400,
          code: 'validation_failed',
          message: 'Request validation failed.',
          details: issues,
        }),
      )
      return
    }
    next()
  }
}

export const getValidatedQuery = <T>(req: unknown): T =>
  (req as { validatedQuery: T }).validatedQuery

export { z }
EOF

# ─── 11. src/shared/security/password.ts ─────────────────────────────────────
cat > src/shared/security/password.ts << 'EOF'
import { hash, verify } from '@node-rs/argon2'

/**
 * Password hashing with argon2id via @node-rs/argon2.
 *
 * @node-rs/argon2 ships prebuilt binaries for Linux, macOS, and Windows, so
 * there's no node-gyp step and no build tools required.
 *
 * POLICY: 8–200 characters. The upper bound is a CPU-burn guard: argon2's cost
 * scales with input length, so a 10 MB "password" is a cheap way to pin a CPU
 * core for a second per request. Reject it at the edge.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 200

// OWASP recommendations for argon2id: m=19 MiB, t=2, p=1.
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // KiB → 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS)
}

/**
 * Verify a password against a stored hash.
 * Note the argument order: verify(hash, plain), NOT verify(plain, hash).
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain)
  } catch {
    return false
  }
}
EOF

# ─── 12. src/shared/security/tokens.ts ───────────────────────────────────────
cat > src/shared/security/tokens.ts << 'EOF'
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
EOF

# ─── 13. src/shared/security/cookies.ts ──────────────────────────────────────
cat > src/shared/security/cookies.ts << 'EOF'
import type { CookieOptions, Response } from 'express'
import { env } from '../../env'

const COOKIE_NAME = 'pa_refresh'
const COOKIE_PATH = '/api/auth'

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
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
EOF

# ─── 14. src/shared/security/rate-limit.ts ───────────────────────────────────
cat > src/shared/security/rate-limit.ts << 'EOF'
import rateLimit, { type Options } from 'express-rate-limit'
import type { Request } from 'express'
import { env } from '../../env'

const shared: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
}

export const globalLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 300 : 10_000,
  message: { error: { code: 'rate_limited', message: 'Too many requests. Slow down.' } },
})

const credentialKey = (req: Request): string => {
  const email =
    req.body && typeof req.body === 'object' && 'email' in req.body
      ? String((req.body as { email: unknown }).email).toLowerCase().slice(0, 200)
      : ''
  return `${req.ip ?? 'unknown'}:${email}`
}

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

export const refreshLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 60 : 600,
  message: { error: { code: 'rate_limited', message: 'Too many refresh attempts.' } },
})
EOF

# ─── 15. src/shared/middleware/request-context.ts ────────────────────────────
cat > src/shared/middleware/request-context.ts << 'EOF'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

export const requestContext: RequestHandler = (_req, res, next) => {
  const id = randomUUID()
  res.locals.requestId = id
  res.setHeader('X-Request-Id', id)
  next()
}

export const getRequestId = (res: { locals: Record<string, unknown> }): string =>
  typeof res.locals.requestId === 'string' ? res.locals.requestId : 'unknown'
EOF

# ─── 16. src/shared/middleware/require-auth.ts ───────────────────────────────
cat > src/shared/middleware/require-auth.ts << 'EOF'
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
EOF

# ─── 17. Auth feature ────────────────────────────────────────────────────────
cat > src/features/auth/auth.schemas.ts << 'EOF'
import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../shared/security/password'
import { MAX_NAME_LENGTH } from '../users/users.schemas'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .refine((v) => EMAIL_PATTERN.test(v), { message: 'That does not look like a valid email.' })

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`)

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(1, 'Please enter your name.').max(MAX_NAME_LENGTH)),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Please enter a password.'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
EOF

cat > src/features/auth/auth.types.ts << 'EOF'
import type { UserDto } from '../users/users.service'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: Date
}

export interface AuthResult {
  user: UserDto
  tokens: AuthTokens
}

export interface RequestContext {
  userAgent: string | null
  ip: string | null
}
EOF

cat > src/features/auth/auth.service.ts << 'EOF'
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

async function createSession(
  userId: string,
  ctx: RequestContext,
  familyId: string = newFamilyId(),
): Promise<{ tokens: AuthTokens; sessionId: string }> {
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

  const session = await prisma.session.create({
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
    return createSession(session.userId, ctx, session.familyId)
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
EOF

cat > src/features/auth/auth.controller.ts << 'EOF'
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

export const me: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const user = await findUserById(userId)
  if (!user) throw unauthorized('session_revoked', 'Your account no longer exists.')
  res.json({ user: toUserDto(user) })
}
EOF

cat > src/features/auth/auth.routes.ts << 'EOF'
import { Router } from 'express'
import { credentialLimiter, refreshLimiter } from '../../shared/security/rate-limit'
import { validate } from '../../shared/http/validate'
import { requireAuth } from '../../shared/middleware/require-auth'
import * as controller from './auth.controller'
import { loginSchema, signupSchema } from './auth.schemas'

export const authRouter = Router()

authRouter.post('/signup', credentialLimiter, validate({ body: signupSchema }), controller.signup)
authRouter.post('/login', credentialLimiter, validate({ body: loginSchema }), controller.login)
authRouter.post('/refresh', refreshLimiter, controller.refresh)
authRouter.post('/logout', controller.logout)
authRouter.get('/me', requireAuth, controller.me)
EOF

# ─── 18. Users feature ───────────────────────────────────────────────────────
cat > src/features/users/users.schemas.ts << 'EOF'
import { z } from 'zod'

export const MAX_NAME_LENGTH = 60

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(1).max(MAX_NAME_LENGTH))
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
EOF

cat > src/features/users/users.service.ts << 'EOF'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { UpdateProfileInput } from './users.schemas'

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type UserRow = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_FIELDS }>

export interface UserDto {
  id: string
  name: string
  email: string
  createdAt: number
}

export const toUserDto = (row: UserRow): UserDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt.getTime(),
})

export async function findUserById(id: string): Promise<UserRow | null> {
  return prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_FIELDS })
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UserRow> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: USER_PUBLIC_FIELDS,
    })
  } catch {
    throw notFound('Account not found.')
  }
}
EOF

cat > src/features/users/users.controller.ts << 'EOF'
import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import type { UpdateProfileInput } from './users.schemas'
import { toUserDto, updateProfile } from './users.service'

export const updateMe: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const updated = await updateProfile(userId, req.body as UpdateProfileInput)
  res.json({ user: toUserDto(updated) })
}
EOF

cat > src/features/users/users.routes.ts << 'EOF'
import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './users.controller'
import { updateProfileSchema } from './users.schemas'

export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.patch('/me', validate({ body: updateProfileSchema }), controller.updateMe)
EOF

# ─── 19. Notes feature ───────────────────────────────────────────────────────
cat > src/features/notes/notes.schemas.ts << 'EOF'
import { z } from 'zod'

export const noteAnchorSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('parts'),
    ids: z.array(z.string().min(1).max(128)).min(1).max(500),
  }),
  z.object({
    kind: z.literal('system'),
    id: z.string().min(1).max(64),
  }),
  z.object({
    kind: z.literal('free'),
  }),
])

export type NoteAnchorInput = z.infer<typeof noteAnchorSchema>

export const createNoteSchema = z.object({
  title: z.string().max(120).default(''),
  body: z.string().max(20_000).default(''),
  anchor: noteAnchorSchema,
})

export const updateNoteSchema = z
  .object({
    title: z.string().max(120).optional(),
    body: z.string().max(20_000).optional(),
    anchor: noteAnchorSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update.' })

export const noteIdParamSchema = z.object({
  id: z.string().uuid('Invalid note id.'),
})

export const listNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
EOF

cat > src/features/notes/notes.types.ts << 'EOF'
import type { NoteAnchorInput } from './notes.schemas'

export interface NoteDto {
  id: string
  title: string
  anchor: NoteAnchorInput
  body: string
  createdAt: number
  updatedAt: number
}
EOF

cat > src/features/notes/notes.service.ts << 'EOF'
import type { Note, Prisma } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { CreateNoteInput, NoteAnchorInput, UpdateNoteInput } from './notes.schemas'
import type { NoteDto } from './notes.types'

type AnchorColumns = { anchorKind: string; anchorIds: string[] }

function anchorToColumns(anchor: NoteAnchorInput): AnchorColumns {
  switch (anchor.kind) {
    case 'parts':
      return { anchorKind: 'parts', anchorIds: [...anchor.ids] }
    case 'system':
      return { anchorKind: 'system', anchorIds: [anchor.id] }
    case 'free':
      return { anchorKind: 'free', anchorIds: [] }
  }
}

function columnsToAnchor(kind: string, ids: readonly string[]): NoteAnchorInput {
  switch (kind) {
    case 'parts':
      return { kind: 'parts', ids: [...ids] }
    case 'system':
      return ids.length === 1 ? { kind: 'system', id: ids[0]! } : { kind: 'free' }
    default:
      return { kind: 'free' }
  }
}

export const toNoteDto = (row: Note): NoteDto => ({
  id: row.id,
  title: row.title,
  anchor: columnsToAnchor(row.anchorKind, row.anchorIds),
  body: row.body,
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
})

const OWNED = (userId: string) => ({ userId }) satisfies Prisma.NoteWhereInput

export async function listNotes(userId: string, limit: number): Promise<NoteDto[]> {
  const rows = await prisma.note.findMany({
    where: OWNED(userId),
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return rows.map(toNoteDto)
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<NoteDto> {
  const row = await prisma.note.create({
    data: {
      userId,
      title: input.title,
      body: input.body,
      ...anchorToColumns(input.anchor),
    },
  })
  return toNoteDto(row)
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<NoteDto> {
  const { count } = await prisma.note.updateMany({
    where: { id: noteId, ...OWNED(userId) },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.anchor ? anchorToColumns(input.anchor) : {}),
    },
  })

  if (count === 0) throw notFound('Note not found.')

  const row = await prisma.note.findUnique({ where: { id: noteId } })
  if (!row) throw notFound('Note not found.')
  return toNoteDto(row)
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const { count } = await prisma.note.deleteMany({
    where: { id: noteId, ...OWNED(userId) },
  })
  if (count === 0) throw notFound('Note not found.')
}
EOF

cat > src/features/notes/notes.controller.ts << 'EOF'
import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import { getValidatedQuery } from '../../shared/http/validate'
import type { CreateNoteInput, UpdateNoteInput } from './notes.schemas'
import * as service from './notes.service'

export const list: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { limit } = getValidatedQuery<{ limit: number }>(req)
  res.json({ notes: await service.listNotes(userId, limit) })
}

export const create: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const note = await service.createNote(userId, req.body as CreateNoteInput)
  res.status(201).json({ note })
}

export const update: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  const note = await service.updateNote(userId, id, req.body as UpdateNoteInput)
  res.json({ note })
}

export const remove: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  await service.deleteNote(userId, id)
  res.status(204).end()
}
EOF

cat > src/features/notes/notes.routes.ts << 'EOF'
import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './notes.controller'
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteIdParamSchema,
  updateNoteSchema,
} from './notes.schemas'

export const notesRouter = Router()

notesRouter.use(requireAuth)

notesRouter.get('/', validate({ query: listNotesQuerySchema }), controller.list)
notesRouter.post('/', validate({ body: createNoteSchema }), controller.create)
notesRouter.patch(
  '/:id',
  validate({ params: noteIdParamSchema, body: updateNoteSchema }),
  controller.update,
)
notesRouter.delete('/:id', validate({ params: noteIdParamSchema }), controller.remove)
EOF

# ─── 20. Presets feature ─────────────────────────────────────────────────────
cat > src/features/presets/presets.schemas.ts << 'EOF'
import { z } from 'zod'

export const createPresetSchema = z.object({
  name: z.string().trim().min(1, 'Please name the preset.').max(60),
  partIds: z.array(z.string().min(1).max(128)).min(1).max(500),
})

export const presetIdParamSchema = z.object({
  id: z.string().uuid('Invalid preset id.'),
})

export type CreatePresetInput = z.infer<typeof createPresetSchema>
EOF

cat > src/features/presets/presets.service.ts << 'EOF'
import type { Preset } from '@prisma/client'
import { prisma } from '../../shared/db/prisma'
import { notFound } from '../../shared/http/errors'
import type { CreatePresetInput } from './presets.schemas'

export interface PresetDto {
  id: string
  name: string
  partIds: readonly string[]
  createdPartCount: number
  createdAt: number
}

export const toPresetDto = (row: Preset): PresetDto => ({
  id: row.id,
  name: row.name,
  partIds: row.partIds,
  createdPartCount: row.createdPartCount,
  createdAt: row.createdAt.getTime(),
})

export async function listPresets(userId: string): Promise<PresetDto[]> {
  const rows = await prisma.preset.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toPresetDto)
}

export async function createPreset(
  userId: string,
  input: CreatePresetInput,
): Promise<PresetDto> {
  const row = await prisma.preset.create({
    data: {
      userId,
      name: input.name,
      partIds: input.partIds,
      createdPartCount: input.partIds.length,
    },
  })
  return toPresetDto(row)
}

export async function deletePreset(userId: string, presetId: string): Promise<void> {
  const { count } = await prisma.preset.deleteMany({
    where: { id: presetId, userId },
  })
  if (count === 0) throw notFound('Preset not found.')
}
EOF

cat > src/features/presets/presets.controller.ts << 'EOF'
import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import type { CreatePresetInput } from './presets.schemas'
import * as service from './presets.service'

export const list: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  res.json({ presets: await service.listPresets(userId) })
}

export const create: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const preset = await service.createPreset(userId, req.body as CreatePresetInput)
  res.status(201).json({ preset })
}

export const remove: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  await service.deletePreset(userId, id)
  res.status(204).end()
}
EOF

cat > src/features/presets/presets.routes.ts << 'EOF'
import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './presets.controller'
import { createPresetSchema, presetIdParamSchema } from './presets.schemas'

export const presetsRouter = Router()

presetsRouter.use(requireAuth)
presetsRouter.get('/', controller.list)
presetsRouter.post('/', validate({ body: createPresetSchema }), controller.create)
presetsRouter.delete('/:id', validate({ params: presetIdParamSchema }), controller.remove)
EOF

# ─── 21. Health feature ──────────────────────────────────────────────────────
cat > src/features/health/health.routes.ts << 'EOF'
import { Router } from 'express'
import { prisma } from '../../shared/db/prisma'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) })
})

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'up' })
  } catch {
    res.status(503).json({ ok: false, db: 'down' })
  }
})
EOF

# ─── 22. src/app.ts ──────────────────────────────────────────────────────────
cat > src/app.ts << 'EOF'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { env } from './env'
import { logger } from './shared/logger'
import { errorHandler, notFoundHandler } from './shared/http/error-handler'
import { globalLimiter } from './shared/security/rate-limit'
import { requestContext } from './shared/middleware/request-context'
import { authRouter } from './features/auth/auth.routes'
import { usersRouter } from './features/users/users.routes'
import { notesRouter } from './features/notes/notes.routes'
import { presetsRouter } from './features/presets/presets.routes'
import { healthRouter } from './features/health/health.routes'

export function createApp() {
  const app = express()

  if (env.TRUST_PROXY) app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: env.isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    }),
  )

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86_400,
    }),
  )

  app.use(express.json({ limit: '256kb' }))
  app.use(express.urlencoded({ extended: false, limit: '256kb' }))
  app.use(cookieParser())
  app.use(requestContext)

  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => res.locals.requestId as string,
      autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
    }),
  )

  app.use('/api', globalLimiter)

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/notes', notesRouter)
  app.use('/api/presets', presetsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
EOF

# ─── 23. src/server.ts ───────────────────────────────────────────────────────
cat > src/server.ts << 'EOF'
import { createApp } from './app'
import { env } from './env'
import { logger } from './shared/logger'
import { prisma } from './shared/db/prisma'

const app = createApp()

await prisma.$connect().catch((err: unknown) => {
  logger.fatal({ err }, 'could not connect to the database')
  process.exit(1)
})

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, origins: env.CORS_ORIGINS },
    `api listening on http://localhost:${env.PORT}`,
  )
})

let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  const forceExit = setTimeout(() => {
    logger.error('shutdown timed out; exiting forcefully')
    process.exit(1)
  }, 10_000)
  forceExit.unref()

  server.close(async (err) => {
    if (err) logger.error({ err }, 'error closing http server')
    try {
      await prisma.$disconnect()
    } catch (e) {
      logger.error({ err: e }, 'error disconnecting prisma')
    }
    clearTimeout(forceExit)
    process.exit(err ? 1 : 0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection')
  void shutdown('unhandledRejection')
})
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception')
  void shutdown('uncaughtException')
})
EOF

# ─── 24. .env with real secrets ──────────────────────────────────────────────
log "Generating secrets"
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
REFRESH_PEPPER=$(openssl rand -base64 48 | tr -d '\n')

cat > .env << EOF
# Generated by rebuild-api.sh on $(date -u +'%Y-%m-%dT%H:%M:%SZ'). Do not commit.
NODE_ENV=development
PORT=4000

DATABASE_URL="postgresql://anatomist:anatomist_dev_pw@localhost:5432/pro_anatomy?schema=public"

JWT_ACCESS_SECRET="$JWT_SECRET"
REFRESH_TOKEN_PEPPER="$REFRESH_PEPPER"

ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30

CORS_ORIGINS=http://localhost:5173

COOKIE_DOMAIN=

TRUST_PROXY=0
EOF

cat > .env.example << 'EOF'
NODE_ENV=development
PORT=4000

DATABASE_URL="postgresql://anatomist:anatomist_dev_pw@localhost:5432/pro_anatomy?schema=public"

# Generate each with:  openssl rand -base64 48
JWT_ACCESS_SECRET="CHANGE_ME_dev_only_at_least_32_chars_long_AAAAAAAAA"
REFRESH_TOKEN_PEPPER="CHANGE_ME_dev_only_at_least_32_chars_long_BBBBBBBBB"

ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30

CORS_ORIGINS=http://localhost:5173

COOKIE_DOMAIN=

TRUST_PROXY=0
EOF

chmod 600 .env
ok "Secrets written to .env"

# ─── 25. Install ─────────────────────────────────────────────────────────────
log "Installing dependencies (this takes ~1–2 minutes)"
npm install --no-audit --no-fund
ok "Dependencies installed"

# ─── 26. Prisma generate ─────────────────────────────────────────────────────
log "Generating Prisma client"
npx prisma generate
ok "Prisma client generated"

# ─── 27. Start Postgres ──────────────────────────────────────────────────────
log "Starting Postgres via docker compose"
docker compose up -d

log "Waiting for Postgres to accept connections"
READY=0
for i in $(seq 1 40); do
  if docker compose exec -T db pg_isready -U anatomist -d pro_anatomy >/dev/null 2>&1; then
    READY=1
    break
  fi
  printf '.'
  sleep 1
done
printf '\n'
if [ "$READY" -ne 1 ]; then
  printf '%sCould not reach Postgres within 40s. Container logs:%s\n' "$C_RED" "$C_RESET"
  docker compose logs db
  die "Postgres did not become ready."
fi
ok "Postgres is ready"

# ─── 28. Migrate ─────────────────────────────────────────────────────────────
log "Applying Prisma migration"
npx prisma migrate dev --name init
ok "Schema applied"

# ─── 29. Typecheck ───────────────────────────────────────────────────────────
log "Typechecking"
if npm run typecheck; then
  ok "Typecheck passed"
else
  warn "Typecheck reported issues — see output above. The server may still run."
fi

# ─── 30. Summary ─────────────────────────────────────────────────────────────
printf '\n%s✔ Backend is ready.%s\n\n' "$C_GREEN$C_BOLD" "$C_RESET"
printf '  %sDirectory%s   %s\n' "$C_DIM" "$C_RESET" "$(pwd)"
printf '  %sEnv file%s    .env  (real secrets, gitignored, mode 600)\n' "$C_DIM" "$C_RESET"
printf '  %sPostgres%s    localhost:5432  (docker compose)\n' "$C_DIM" "$C_RESET"
printf '  %sPort%s        %s\n\n' "$C_DIM" "$C_RESET" "${PORT:-4000}"

printf '%sStart the server:%s\n' "$C_BOLD" "$C_RESET"
printf '  cd %s && npm run dev\n\n' "$TARGET"

printf '%sSmoke test (in another terminal):%s\n' "$C_BOLD" "$C_RESET"
cat <<'SMOKE'
  curl -s localhost:4000/api/health/ready
  # {"ok":true,"db":"up"}

  curl -s -X POST localhost:4000/api/auth/signup \
    -H 'content-type: application/json' \
    -d '{"name":"Ada","email":"ada@example.com","password":"correct horse battery"}' \
    -c /tmp/cookies.txt
  # {"user":{...},"accessToken":"eyJ..."}
SMOKE
printf '\n'
