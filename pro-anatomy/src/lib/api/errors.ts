export class HttpError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string) {
    super(`HTTP ${status} while fetching ${url}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

/** Field-level error the API returns inside `error.details` on validation_failed. */
export interface ApiFieldError {
  path: string
  message: string
}

/** The API's error envelope: { error: { code, message, details? } }. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: readonly ApiFieldError[]
  }
}

/**
 * Any non-2xx response that carries the standard envelope. `code` is the
 * machine-readable string the backend set — see api/src/shared/http/errors.ts.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: readonly ApiFieldError[]

  constructor(
    status: number,
    code: string,
    message: string,
    details?: readonly ApiFieldError[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}
