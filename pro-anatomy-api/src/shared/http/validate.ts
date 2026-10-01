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
