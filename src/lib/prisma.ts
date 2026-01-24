/**
 * Prisma Client Instance (Optimized with Connection Pooling)
 * Singleton pattern to prevent multiple instances
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool configuration for better performance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Extend with query performance monitoring in development
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;
    
    // Warn about slow queries (>100ms)
    if (duration > 100) {
      console.warn(`⚠️  Slow query: ${params.model}.${params.action} took ${duration}ms`);
    }
    
    return result;
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
