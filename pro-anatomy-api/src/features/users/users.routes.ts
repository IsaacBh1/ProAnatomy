import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/require-auth'
import { validate } from '../../shared/http/validate'
import * as controller from './users.controller'
import { updateProfileSchema } from './users.schemas'

export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.patch('/me', validate({ body: updateProfileSchema }), controller.updateMe)
