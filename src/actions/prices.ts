"use server";

/**
 * Server Actions - Product Prices Management
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SaleUnit } from "@prisma/client";

const PriceSchema = z.object({
  productId: z.string(),
  spaceId: z.string(),
  priceUsd: z.coerce.number().positive("Le prix USD doit être positif"),
  priceCdf: z.coerce.number().positive("Le prix CDF doit être positif"),
  forUnit: z.nativeEnum(SaleUnit).default(SaleUnit.BOTTLE),
});

const CostSchema = z.object({
  productId: z.string(),
  unitCostUsd: z.coerce.number().positive("Le coût USD doit être positif"),
  unitCostCdf: z.coerce.number().positive("Le coût CDF doit être positif"),
  forUnit: z.nativeEnum(SaleUnit).default(SaleUnit.BOTTLE),
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

export async function upsertProductPrice(data: z.infer<typeof PriceSchema>) {
  try {
    const { session } = await requireRole(["ADMIN", "MANAGER"]);
    const userId = (session.user as any).id;
    
    const validatedData = PriceSchema.parse(data);
    
    const price = await prisma.productPrice.upsert({
      where: {
        productId_spaceId_forUnit: {
          productId: validatedData.productId,
          spaceId: validatedData.spaceId,
          forUnit: validatedData.forUnit,
        },
      },
      update: {
        priceUsd: validatedData.priceUsd,
        priceCdf: validatedData.priceCdf,
      },
      create: {
        productId: validatedData.productId,
        spaceId: validatedData.spaceId,
        priceUsd: validatedData.priceUsd,
        priceCdf: validatedData.priceCdf,
        forUnit: validatedData.forUnit,
      },
    });
    
    await createAuditLog({
      userId,
      action: "UPDATE_PRODUCT",
      entity: "ProductPrice",
      entityId: price.id,
      metadata: { price },
    });
    
    revalidatePath("/dashboard/products");
    return { success: true, data: price };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message };
  }
}

export async function upsertProductCost(data: z.infer<typeof CostSchema>) {
  try {
    const { session } = await requireRole(["ADMIN", "MANAGER"]);
    const userId = (session.user as any).id;
    
    const validatedData = CostSchema.parse(data);
    
    const cost = await prisma.productCost.upsert({
      where: {
        productId_forUnit: {
          productId: validatedData.productId,
          forUnit: validatedData.forUnit,
        },
      },
      update: {
        unitCostUsd: validatedData.unitCostUsd,
        unitCostCdf: validatedData.unitCostCdf,
      },
      create: {
        productId: validatedData.productId,
        unitCostUsd: validatedData.unitCostUsd,
        unitCostCdf: validatedData.unitCostCdf,
        forUnit: validatedData.forUnit,
      },
    });
    
    await createAuditLog({
      userId,
      action: "UPDATE_PRODUCT",
      entity: "ProductCost",
      entityId: cost.id,
      metadata: { cost },
    });
    
    revalidatePath("/dashboard/products");
    return { success: true, data: cost };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message };
  }
}
