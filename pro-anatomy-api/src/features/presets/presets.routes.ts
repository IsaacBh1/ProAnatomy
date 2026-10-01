import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './presets.controller'
import { createPresetSchema, presetIdParamSchema } from './presets.schemas'

export const presetsRouter = Router()

presetsRouter.use(requireAuth)
presetsRouter.get('/', controller.list)
presetsRouter.post('/', validate({ body: createPresetSchema }), controller.create)
presetsRouter.delete('/:id', validate({ params: presetIdParamSchema }), controller.remove)
