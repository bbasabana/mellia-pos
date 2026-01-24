"use server";

/**
 * Server Actions - Products Management
 * CRUD operations for products with validation and audit logging
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ProductType, BeverageCategory, FoodCategory, ProductSize, SaleUnit, Prisma } from "@prisma/client";

// ============================================
// Validation Schemas
// ============================================

const ProductSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.nativeEnum(ProductType),
  beverageCategory: z.nativeEnum(BeverageCategory).optional(),
  foodCategory: z.nativeEnum(FoodCategory).optional(),
  size: z.nativeEnum(ProductSize).default(ProductSize.STANDARD),
  saleUnit: z.nativeEnum(SaleUnit),
  unitValue: z.coerce.number().positive().optional(),
  vendable: z.boolean().default(true),
  active: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

// ============================================
// Helper Functions
// ============================================

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Non authentifié");
  }
  return session;
}

async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as any).role;
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Permission refusée");
  }
  
  return { session, userRole };
}

// ============================================
// CRUD Actions
// ============================================

/**
 * Get all products with optional filters
 */
export async function getProducts(filters?: {
  type?: string;
  categoryId?: string;
  active?: boolean;
  vendable?: boolean;
  search?: string;
}) {
  try {
    await requireAuth();

    const products = await prisma.product.findMany({
      where: {
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.active !== undefined && { active: filters.active }),
        ...(filters?.vendable !== undefined && { vendable: filters.vendable }),
        ...(filters?.search && {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        prices: {
          include: {
            space: true,
          },
        },
        costs: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string) {
  try {
    await requireAuth();

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        prices: {
          include: {
            space: true,
          },
        },
        costs: true,
      },
    });

    if (!product) {
      return { success: false, error: "Produit introuvable" };
    }

    return { success: true, data: product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new product
 */
export async function createProduct(data: z.infer<typeof ProductSchema>) {
  try {
    const { session } = await requireRole(["ADMIN", "MANAGER"]);
    const userId = (session.user as any).id;

    // Validate input
    const validatedData = ProductSchema.parse(data);

    // Create product
    const product = await prisma.product.create({
      data: validatedData as Prisma.ProductCreateInput,
      include: {
        prices: {
          include: {
            space: true,
          },
        },
        costs: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      metadata: { product },
    });

    revalidatePath("/dashboard/products");

    return { success: true, data: product };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  data: Partial<z.infer<typeof ProductSchema>>
) {
  try {
    const { session } = await requireRole(["ADMIN", "MANAGER"]);
    const userId = (session.user as any).id;

    // Get existing product for audit
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { success: false, error: "Produit introuvable" };
    }

    // Validate input
    const validatedData = ProductSchema.partial().parse(data);

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: validatedData as Prisma.ProductUpdateInput,
      include: {
        prices: {
          include: {
            space: true,
          },
        },
        costs: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      metadata: {
        before: existingProduct,
        after: product,
      },
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${id}`);

    return { success: true, data: product };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string) {
  try {
    const { session } = await requireRole(["ADMIN"]);
    const userId = (session.user as any).id;

    // Get product for audit
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: "Produit introuvable" };
    }

    // Delete product (cascade will delete prices and cost)
    await prisma.product.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: id,
      metadata: { product },
    });

    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(id: string) {
  try {
    const { session } = await requireRole(["ADMIN", "MANAGER"]);
    const userId = (session.user as any).id;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: "Produit introuvable" };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: !product.active },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: id,
      metadata: {
        action: updated.active ? "activated" : "deactivated",
      },
    });

    revalidatePath("/dashboard/products");

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
