import type { RequestHandler } from 'express'
import { getAuth } from '../../shared/middleware/require-auth'
import { getValidatedQuery } from '../../shared/http/validate'
import type { CreateNoteInput, UpdateNoteInput } from './notes.schemas'
import * as service from './notes.service'

export const list: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { limit } = getValidatedQuery<{ limit: number }>(req)
  res.json({ notes: await service.listNotes(userId, limit) })
}

export const create: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const note = await service.createNote(userId, req.body as CreateNoteInput)
  res.status(201).json({ note })
}

export const update: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  const note = await service.updateNote(userId, id, req.body as UpdateNoteInput)
  res.json({ note })
}

export const remove: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req)
  const { id } = req.params as { id: string }
  await service.deleteNote(userId, id)
  res.status(204).end()
}
