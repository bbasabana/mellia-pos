/**
 * Prisma Client Instances
 *
 * - `prisma`         → pooled connection (PgBouncer via Neon pooler URL). Fast for simple queries.
 * - `prismaUnpooled` → direct connection (no PgBouncer). Required for $transaction calls because
 *                      PgBouncer in transaction-pooling mode does not support interactive transactions (BEGIN/COMMIT).
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUnpooled: PrismaClient | undefined;
};

const logLevel: ("error" | "warn" | "info" | "query")[] =
  process.env.NODE_ENV === "development"
    ? ["error", "warn"]
    : ["error"];

// Pooled client — use for all non-transactional reads/writes
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: logLevel });

// Unpooled (direct) client — use exclusively for prisma.$transaction()
export const prismaUnpooled =
  globalForPrisma.prismaUnpooled ??
  new PrismaClient({
    log: logLevel,
    datasources: {
      db: {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      },
    },
  });

// Extend pooled client with query performance monitoring in development
if (process.env.NODE_ENV === "development") {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const duration = Date.now() - before;
    if (duration > 100) {
      console.warn(`⚠️  Slow query: ${params.model}.${params.action} took ${duration}ms`);
    }
    return result;
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUnpooled = prismaUnpooled;
}

export default prisma;
