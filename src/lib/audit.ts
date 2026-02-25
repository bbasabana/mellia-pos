/**
 * Audit Log Helper
 * Track all critical actions in the system
 */

import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "CREATE_SALE"
  | "DELETE_SALE"
  | "CREATE_PURCHASE"
  | "DELETE_PURCHASE"
  | "STOCK_ADJUSTMENT"
  | "CREATE_LOSS"
  | "UPDATE_LOSS"
  | "SYSTEM_RESET"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  metadata,
}: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should never break the app
  }
}

export async function getAuditLogs({
  userId,
  action,
  entity,
  limit = 100,
}: {
  userId?: string;
  action?: AuditAction;
  entity?: string;
  limit?: number;
}) {
  return prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entity && { entity }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
