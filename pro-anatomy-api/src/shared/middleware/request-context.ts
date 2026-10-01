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
