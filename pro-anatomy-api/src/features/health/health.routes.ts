import { Router } from 'express'
import { prisma } from '../../shared/db/prisma'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) })
})

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'up' })
  } catch {
    res.status(503).json({ ok: false, db: 'down' })
  }
})
