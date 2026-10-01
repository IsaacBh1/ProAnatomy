export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

/**
 * Codes the UI renders specialised copy for. Anything the API sends that is
 * not in this list surfaces as `unknown`, with the API's own message shown.
 */
export type AuthErrorCode =
  | 'email_taken'
  | 'invalid_credentials'
  | 'invalid_email'
  | 'weak_password'
  | 'rate_limited'
  | 'validation_failed'
  | 'unknown'

export interface AuthError {
  code: AuthErrorCode
  message: string
}

export type AuthResult = { ok: true; user: User } | { ok: false; error: AuthError }

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}
