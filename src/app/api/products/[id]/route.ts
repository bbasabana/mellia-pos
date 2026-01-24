import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { product, prices, measurePrices, halfPlatePrices, cost, exchangeRate } = body;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: product.name,
        type: product.type,
        beverageCategory: product.beverageCategory || null,
        foodCategory: product.foodCategory || null,
        size: product.size,
        saleUnit: product.saleUnit,
        unitValue: product.unitValue,
        purchaseUnit: product.purchaseUnit,
        packingQuantity: product.packingQuantity ? parseInt(String(product.packingQuantity)) : 1, // Default to 1 if missing or invalid
        description: product.description,
        vendable: product.vendable,
        active: product.active,
      },
    });

    // Delete old prices
    await prisma.productPrice.deleteMany({
      where: { productId: params.id },
    });

    // Create new prices
    for (const [spaceId, priceUsd] of Object.entries(prices)) {
      if ((priceUsd as number) > 0) {
        await prisma.productPrice.create({
          data: {
            productId: params.id,
            spaceId: spaceId,
            priceUsd: priceUsd as number,
            priceCdf: (priceUsd as number) * exchangeRate,
            forUnit: product.saleUnit === "MEASURE" ? "MEASURE" : "BOTTLE",
          },
        });
      }
    }

    // Create measure prices if applicable
    if (measurePrices) {
      for (const [spaceId, priceUsd] of Object.entries(measurePrices)) {
        if ((priceUsd as number) > 0) {
          await prisma.productPrice.create({
            data: {
              productId: params.id,
              spaceId: spaceId,
              priceUsd: priceUsd as number,
              priceCdf: (priceUsd as number) * exchangeRate,
              forUnit: "MEASURE",
            },
          });
        }
      }
    }

    // Create half-plate prices if applicable
    if (halfPlatePrices) {
      for (const [spaceId, priceUsd] of Object.entries(halfPlatePrices)) {
        if ((priceUsd as number) > 0) {
          await prisma.productPrice.create({
            data: {
              productId: params.id,
              spaceId: spaceId,
              priceUsd: priceUsd as number,
              priceCdf: (priceUsd as number) * exchangeRate,
              forUnit: "HALF_PLATE",
            },
          });
        }
      }
    }

    // Update cost
    await prisma.productCost.deleteMany({
      where: { productId: params.id },
    });

    if (cost > 0) {
      await prisma.productCost.create({
        data: {
          productId: params.id,
          unitCostUsd: cost,
          unitCostCdf: cost * exchangeRate,
          forUnit: product.saleUnit === "MEASURE" ? "MEASURE" : "BOTTLE",
        },
      });

      // If needed, create cost for HALF_PLATE (50% of cost)
      if (halfPlatePrices && Object.keys(halfPlatePrices).length > 0) {
        await prisma.productCost.create({
          data: {
            productId: params.id,
            unitCostUsd: cost / 2,
            unitCostCdf: (cost * exchangeRate) / 2,
            forUnit: "HALF_PLATE",
          },
        });
      }
    }

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: params.id,
      metadata: { product: updatedProduct },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: params.id,
      metadata: {},
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Quick update (name, description, active)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, active } = body;

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        active,
      },
    });

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: params.id,
      metadata: { product: updatedProduct },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
