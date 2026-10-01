import { PrismaClient } from '@prisma/client'
import { env } from '../../env'
import { logger } from '../logger'

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient }

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.isProduction
      ? [{ emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  })

prisma.$on('error' as never, (e: unknown) => {
  logger.error({ prisma: e }, 'prisma error')
})

if (!env.isProduction) globalForPrisma.__prisma = prisma
