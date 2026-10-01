import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import type { CreatePresetInput } from './presets.schemas'
import * as service from './presets.service'

export const list: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  res.json({ presets: await service.listPresets(userId) })
}

export const create: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const preset = await service.createPreset(userId, req.body as CreatePresetInput)
  res.status(201).json({ preset })
}

export const remove: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  await service.deletePreset(userId, id)
  res.status(204).end()
}
