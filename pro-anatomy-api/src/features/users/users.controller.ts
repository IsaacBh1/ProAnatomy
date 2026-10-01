import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import type { UpdateProfileInput } from './users.schemas'
import { toUserDto, updateProfile } from './users.service'

export const updateMe: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const updated = await updateProfile(userId, req.body as UpdateProfileInput)
  res.json({ user: toUserDto(updated) })
}
