export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 60

/**
 * Deliberately loose. The authoritative check for an email is whether it
 * receives mail, which only a server round-trip can answer. This rejects the
 * obvious typos without blocking valid but unusual addresses.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()
export const normalizeName = (name: string): string => name.trim().replace(/\s+/g, ' ')

/** Each validator returns `null` when valid, or a user-facing message. */
export function validateName(name: string): string | null {
  const value = normalizeName(name)
  if (!value) return 'Please enter your name.'
  if (value.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
  return null
}

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email)
  if (!value) return 'Please enter your email.'
  if (!EMAIL_PATTERN.test(value)) return 'That does not look like a valid email.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Please enter a password.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.'
  if (confirm !== password) return 'Passwords do not match.'
  return null
}
