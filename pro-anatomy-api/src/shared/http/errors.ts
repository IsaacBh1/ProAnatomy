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
