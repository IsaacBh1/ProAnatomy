import { z } from 'zod'

export const MAX_NAME_LENGTH = 60

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(1).max(MAX_NAME_LENGTH))
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
