// src/shared/http/docs.ts
import { apiReference } from '@scalar/express-api-reference'
import { Router } from 'express'
import helmet from 'helmet'
import { buildOpenApiDocument } from './openapi'

/**
 * The global helmet policy is `default-src 'none'` — correct for an API that
 * only returns JSON, hostile to any HTML page. Docs need their own policy.
 */
const docsCsp = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'none'"],
      'script-src': ["'self'", 'https:', "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      'font-src': ["'self'", 'https:', 'data:'],
      'img-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", 'https:'],
      'frame-ancestors': ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
})

/**
 * Raw spec at the conventional path. Postman, Insomnia, and codegen tools
 * hard-code this location, so it's worth serving even though the UI below
 * doesn't depend on it.
 */
export const openApiRouter = Router()
openApiRouter.use(docsCsp)
openApiRouter.get('/', (_req, res) => {
  res.json(buildOpenApiDocument())
})

/** Human-facing UI. */
export const docsRouter = Router()
docsRouter.use(docsCsp)
docsRouter.use(
  apiReference({
    // Pass the spec directly as a string. Scalar skips its HTTP fetch entirely,
    // which sidesteps the whole "which URL does it resolve to" class of bugs.
    // Top-level `content`, not `spec.content` — the `spec` prefix was removed
    // in @scalar/api-reference 1.72.
    content: JSON.stringify(buildOpenApiDocument()),
    withDefaultFonts: true,
    theme: 'default',
  }),
)
