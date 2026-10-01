import { z } from 'zod'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isCommonPassword,
} from '../../shared/security/password'
import { MAX_NAME_LENGTH } from '../users/users.schemas'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .refine((v) => EMAIL_PATTERN.test(v), { message: 'That does not look like a valid email.' })

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`)
  .refine((v) => !isCommonPassword(v), {
    message: 'That password appears in breach lists. Please choose a different one.',
  })

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(1, 'Please enter your name.').max(MAX_NAME_LENGTH)),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Please enter a password.'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
