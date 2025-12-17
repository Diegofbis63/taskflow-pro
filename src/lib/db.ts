import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Don't initialize Prisma client if DATABASE_URL is not available
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database features will be disabled.')
}

export const db = process.env.DATABASE_URL
  ? globalForPrisma.prisma ??
    new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  : null

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prisma = db
}