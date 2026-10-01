import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * Direct (non-pooled) connection. Prisma Migrate uses this — the pooler
   * does not support the advisory locks migrations take. On Neon, this is the
   * same hostname as DATABASE_URL without the `-pooler` suffix.
   *
   * Required even in dev: Prisma validates the datasource block at startup.
   * Point it at the same URL as DATABASE_URL locally; it's unused there.
   */
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

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

  /**
   * SameSite for the refresh cookie.
   *
   *   local dev (same-site)          → 'strict'  (default)
   *   front and back on same domain  → 'lax' or 'strict'
   *   front and back on different    → 'none'
   *   domains (Vercel ↔ Render)        (requires Secure, which HTTPS gives us)
   *
   * 'none' is what makes cross-site refresh work. It is safe here only because
   * `originCheck` rejects state-changing requests whose Origin is not in
   * CORS_ORIGINS — that check is the CSRF defence, not SameSite.
   */
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),

  TRUST_PROXY: z
    .string()
    .default('0')
    .transform((v) => v === '1' || v === 'true')
    .pipe(z.boolean()),

  ENABLE_DOCS: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return undefined
      const lower = v.toLowerCase()
      return lower === '1' || lower === 'true'
    }),
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

export const docsEnabled = env.ENABLE_DOCS ?? !env.isProduction

export type Env = typeof env
