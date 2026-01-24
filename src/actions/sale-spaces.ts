"use server";

/**
 * Server Actions - Sale Spaces Management
 * CRUD operations for sale spaces
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Validation Schema
const SaleSpaceSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Non authentifié");
  return session;
}

async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as any).role;
  if (!allowedRoles.includes(userRole)) throw new Error("Permission refusée");
  return { session, userRole };
}

export async function getSaleSpaces() {
  try {
    await requireAuth();
    const spaces = await prisma.saleSpace.findMany({
      include: {
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: spaces };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSaleSpace(data: z.infer<typeof SaleSpaceSchema>) {
  try {
    const { session } = await requireRole(["ADMIN"]);
    const userId = (session.user as any).id;
    
    const validatedData = SaleSpaceSchema.parse(data);
    const space = await prisma.saleSpace.create({ data: validatedData as any });
    
    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "SaleSpace",
      entityId: space.id,
      metadata: { space },
    });
    
    revalidatePath("/dashboard/products");
    return { success: true, data: space };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message };
  }
}

export async function updateSaleSpace(id: string, data: Partial<z.infer<typeof SaleSpaceSchema>>) {
  try {
    const { session } = await requireRole(["ADMIN"]);
    const userId = (session.user as any).id;
    
    const validatedData = SaleSpaceSchema.partial().parse(data) as Record<string, any>;
    const space = await prisma.saleSpace.update({
      where: { id },
      data: validatedData,
    });
    
    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "SaleSpace",
      entityId: space.id,
      metadata: { space },
    });
    
    revalidatePath("/dashboard/products");
    return { success: true, data: space };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
