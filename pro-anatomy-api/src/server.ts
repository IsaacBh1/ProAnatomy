import { createApp } from './app'
import { env } from './env'
import { logger } from './shared/logger'
import { prisma } from './shared/db/prisma'
import { pruneExpiredSessions } from './features/auth/auth.service'

const PRUNE_INTERVAL_MS = 60 * 60 * 1000 // one hour

const app = createApp()

await prisma.$connect().catch((err: unknown) => {
  logger.fatal({ err }, 'could not connect to the database')
  process.exit(1)
})

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, origins: env.CORS_ORIGINS },
    `api listening on http://localhost:${env.PORT}`,
  )
})

/**
 * Session cleanup. `pruneExpiredSessions` existed from day one but nothing
 * called it, so the sessions table grew forever. Running it on a fixed
 * interval keeps the table bounded without needing a scheduler or cron.
 *
 * `.unref()` so the timer doesn't keep the process alive on shutdown.
 */
async function runPrune(): Promise<void> {
  try {
    const removed = await pruneExpiredSessions()
    if (removed > 0) logger.info({ removed }, 'pruned expired sessions')
  } catch (err) {
    logger.error({ err }, 'session prune failed')
  }
}

// Delay the first run so it doesn't compete with the boot path.
const firstPrune = setTimeout(runPrune, 30_000)
firstPrune.unref()
const pruneTimer = setInterval(runPrune, PRUNE_INTERVAL_MS)
pruneTimer.unref()

let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')

  clearInterval(pruneTimer)
  clearTimeout(firstPrune)

  const forceExit = setTimeout(() => {
    logger.error('shutdown timed out; exiting forcefully')
    process.exit(1)
  }, 10_000)
  forceExit.unref()

  server.close(async (err) => {
    if (err) logger.error({ err }, 'error closing http server')
    try {
      await prisma.$disconnect()
    } catch (e) {
      logger.error({ err: e }, 'error disconnecting prisma')
    }
    clearTimeout(forceExit)
    process.exit(err ? 1 : 0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection')
  void shutdown('unhandledRejection')
})
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception')
  void shutdown('uncaughtException')
})
