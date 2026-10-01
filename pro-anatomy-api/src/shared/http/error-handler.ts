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
