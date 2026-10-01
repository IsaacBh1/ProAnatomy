import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './notes.controller'
import {
  createNoteSchema,
  listNotesQuerySchema,
  noteIdParamSchema,
  updateNoteSchema,
} from './notes.schemas'

export const notesRouter = Router()

notesRouter.use(requireAuth)

notesRouter.get('/', validate({ query: listNotesQuerySchema }), controller.list)
notesRouter.post('/', validate({ body: createNoteSchema }), controller.create)
notesRouter.patch(
  '/:id',
  validate({ params: noteIdParamSchema, body: updateNoteSchema }),
  controller.update,
)
notesRouter.delete('/:id', validate({ params: noteIdParamSchema }), controller.remove)
