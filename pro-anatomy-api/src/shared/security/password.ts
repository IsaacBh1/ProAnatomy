import { hash, verify } from '@node-rs/argon2'

/**
 * Password hashing with argon2id via @node-rs/argon2.
 *
 * @node-rs/argon2 ships prebuilt binaries for Linux, macOS, and Windows, so
 * there's no node-gyp step and no build tools required.
 *
 * POLICY: 8–200 characters. The upper bound is a CPU-burn guard: argon2's cost
 * scales with input length, so a 10 MB "password" is a cheap way to pin a CPU
 * core for a second per request. Reject it at the edge.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 200

// OWASP recommendations for argon2id: m=19 MiB, t=2, p=1.
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // KiB → 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const

/**
 * The top of every breach list. This is a UX guardrail, not a security
 * boundary — it stops the user who types "password1" from being the easy
 * target. A proper defence uses the HaveIBeenPwned range API (k-anonymity),
 * which needs outbound network; that's a follow-up.
 *
 * Matching is case-insensitive: "Password" and "password" are the same secret.
 */
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein',
  '696969', 'shadow', 'master', '666666', 'qwertyuiop', '123321', 'mustang',
  '1234567890', 'michael', '654321', 'superman', '1qaz2wsx', '7777777', '121212',
  '000000', 'qazwsx', '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm',
  'asdfgh', 'hunter', 'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger',
  'sunshine', 'iloveyou', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel',
  'starwars', 'klaster', '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper',
  '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777', 'pass',
  'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda',
  'summer', 'love', 'ashley', 'nicole', 'chelsea', 'biteme', 'matthew', 'access',
  'yankees', '987654321', 'dallas', 'austin', 'thunder', 'taylor', 'matrix',
  'password1', 'password123', 'welcome', 'welcome1', 'admin', 'administrator',
  'root', 'toor', 'guest', 'changeme', 'letmein1',
])

export function isCommonPassword(plain: string): boolean {
  return COMMON_PASSWORDS.has(plain.toLowerCase())
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS)
}

/**
 * Verify a password against a stored hash.
 * Note the argument order: verify(hash, plain), NOT verify(plain, hash).
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain)
  } catch {
    return false
  }
}
