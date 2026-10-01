import { z } from 'zod'

export const noteAnchorSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('parts'),
    ids: z.array(z.string().min(1).max(128)).min(1).max(500),
  }),
  z.object({
    kind: z.literal('system'),
    id: z.string().min(1).max(64),
  }),
  z.object({
    kind: z.literal('free'),
  }),
])

export type NoteAnchorInput = z.infer<typeof noteAnchorSchema>

export const createNoteSchema = z.object({
  title: z.string().max(120).default(''),
  body: z.string().max(20_000).default(''),
  anchor: noteAnchorSchema,
})

export const updateNoteSchema = z
  .object({
    title: z.string().max(120).optional(),
    body: z.string().max(20_000).optional(),
    anchor: noteAnchorSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update.' })

export const noteIdParamSchema = z.object({
  id: z.string().uuid('Invalid note id.'),
})

export const listNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
