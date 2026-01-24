import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// GET all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    // Support query params for filtering
    const { searchParams } = new URL(request.url);
    const vendableOnly = searchParams.get("vendable") === "true";
    const activeOnly = searchParams.get("active") !== "false"; // Default to true

    // Optimized query for POS (vendable=true)
    let products;

    if (vendableOnly) {
      products = await prisma.product.findMany({
        where: {
          ...(activeOnly && { active: true }),
          vendable: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          beverageCategory: true,
          foodCategory: true,
          size: true, // Needed for POS logic
          saleUnit: true,
          active: true,
          // Relations needed for POS only
          prices: {
            select: {
              id: true,
              priceUsd: true,
              priceCdf: true,
              forUnit: true,
              space: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          stockItems: {
            select: {
              location: true,
              quantity: true
            }
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    } else {
      // Full data for Admin / Management
      products = await prisma.product.findMany({
        where: {
          ...(activeOnly && { active: true }),
          // If vendable param was passed but false, we respect it, otherwise ignored
          ...(searchParams.has("vendable") && { vendable: false }),
        },
        include: {
          prices: {
            include: {
              space: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          costs: true,
          stockItems: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { product, prices, measurePrices, halfPlatePrices, cost, exchangeRate } = body;

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        name: product.name,
        type: product.type,
        ...(product.beverageCategory && {
          beverageCategory: product.beverageCategory,
        }),
        ...(product.foodCategory && { foodCategory: product.foodCategory }),
        size: product.size,
        saleUnit: product.saleUnit,
        unitValue: product.unitValue,
        purchaseUnit: product.purchaseUnit, // New field, optional
        packingQuantity: product.packingQuantity || 1, // New field, default 1
        description: product.description,
        vendable: product.vendable,
        active: product.active,
      },
    });

    // Create prices for each space
    for (const [spaceId, priceUsd] of Object.entries(prices)) {
      if ((priceUsd as number) > 0) {
        await prisma.productPrice.create({
          data: {
            productId: newProduct.id,
            spaceId: spaceId,
            priceUsd: priceUsd as number,
            priceCdf: (priceUsd as number) * exchangeRate,
            forUnit: product.saleUnit === "MEASURE" ? "MEASURE" : "BOTTLE",
          },
        });
      }
    }

    // Create measure prices if applicable (whisky)
    if (measurePrices) {
      for (const [spaceId, priceUsd] of Object.entries(measurePrices)) {
        if ((priceUsd as number) > 0) {
          await prisma.productPrice.create({
            data: {
              productId: newProduct.id,
              spaceId: spaceId,
              priceUsd: priceUsd as number,
              priceCdf: (priceUsd as number) * exchangeRate,
              forUnit: "MEASURE",
            },
          });
        }
      }
    }

    // Create half-plate prices if applicable (food)
    if (halfPlatePrices) {
      for (const [spaceId, priceUsd] of Object.entries(halfPlatePrices)) {
        if ((priceUsd as number) > 0) {
          await prisma.productPrice.create({
            data: {
              productId: newProduct.id,
              spaceId: spaceId,
              priceUsd: priceUsd as number,
              priceCdf: (priceUsd as number) * exchangeRate,
              forUnit: "HALF_PLATE",
            },
          });
        }
      }
    }

    // Create cost
    if (cost > 0) {
      await prisma.productCost.create({
        data: {
          productId: newProduct.id,
          unitCostUsd: cost,
          unitCostCdf: cost * exchangeRate,
          forUnit: product.saleUnit, // FIX: Use the actual sale unit
        },
      });

      // If needed, create cost for HALF_PLATE (50% of cost)
      if (halfPlatePrices && Object.keys(halfPlatePrices).length > 0) {
        await prisma.productCost.create({
          data: {
            productId: newProduct.id,
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
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: newProduct.id,
      metadata: { product: newProduct },
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
