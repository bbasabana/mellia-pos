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

// In development only log errors/warnings. Never log queries — they produce
// duplicate output when the middleware pattern is also used.
const logLevel: ("error" | "warn" | "info" | "query")[] = ["error"];

// Pooled client — use for all non-transactional reads/writes.
// The global singleton pattern prevents creating a new client (and a new
// connection pool) on every hot-module reload in development.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: logLevel });

// Unpooled (direct) client — use exclusively for prisma.$transaction().
// PgBouncer in transaction-pooling mode does not support interactive
// transactions (BEGIN/COMMIT), so transactions must bypass the pooler.
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

// Cache on globalThis so HMR reloads reuse the same client (and pool).
globalForPrisma.prisma = prisma;
globalForPrisma.prismaUnpooled = prismaUnpooled;

export default prisma;
