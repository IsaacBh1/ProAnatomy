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
