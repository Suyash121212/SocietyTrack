import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma v7 requires a driver adapter for direct database connections
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Global singleton pattern — prevents multiple PrismaClient instances
// during development hot-reload (nodemon restarts)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
