import { apiReference } from '@scalar/express-api-reference'
import { Router } from 'express'
import helmet from 'helmet'
import { buildOpenApiDocument } from './openapi'

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

export const openApiRouter = Router()
openApiRouter.use(docsCsp)
openApiRouter.get('/', (_req, res) => {
  res.json(buildOpenApiDocument())
})

export const docsRouter = Router()
docsRouter.use(docsCsp)
docsRouter.use(
  apiReference({
    content: JSON.stringify(buildOpenApiDocument()),
    withDefaultFonts: true,
    theme: 'default',
  }),
)
