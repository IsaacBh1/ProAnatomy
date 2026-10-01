import { Router } from 'express'
import {
  credentialLimiter,
  refreshLimiter,
  signupLimiter,
} from '../../shared/security/rate-limit'
import { validate } from '../../shared/http/validate'
import { requireAuth } from '../../shared/middleware/require-auth'
import * as controller from './auth.controller'
import { loginSchema, signupSchema } from './auth.schemas'

export const authRouter = Router()

authRouter.post(
  '/signup',
  signupLimiter,
  credentialLimiter,
  validate({ body: signupSchema }),
  controller.signup,
)
authRouter.post('/login', credentialLimiter, validate({ body: loginSchema }), controller.login)
authRouter.post('/refresh', refreshLimiter, controller.refresh)
authRouter.post('/logout', controller.logout)
authRouter.post('/logout-all', requireAuth, controller.logoutAll)
authRouter.get('/me', requireAuth, controller.me)
