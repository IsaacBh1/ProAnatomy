import { z } from 'zod'

export const createPresetSchema = z.object({
  name: z.string().trim().min(1, 'Please name the preset.').max(60),
  partIds: z.array(z.string().min(1).max(128)).min(1).max(500),
})

export const presetIdParamSchema = z.object({
  id: z.string().uuid('Invalid preset id.'),
})

export type CreatePresetInput = z.infer<typeof createPresetSchema>
