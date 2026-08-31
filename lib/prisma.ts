import { PrismaClient } from '@prisma/client'

// Declaración global para evitar múltiples instancias en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma