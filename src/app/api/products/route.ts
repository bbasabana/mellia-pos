import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { cache } from "@/lib/cache";

const PRODUCT_CACHE_KEY = "products:vendable";
const PRODUCT_CACHE_TTL = 30_000; // 30 seconds

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
      products = await cache.get(
        PRODUCT_CACHE_KEY,
        () => prisma.product.findMany({
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
            size: true,
            saleUnit: true,
            active: true,
            prices: {
              select: {
                id: true,
                priceUsd: true,
                priceCdf: true,
                forUnit: true,
                space: {
                  select: { id: true, name: true },
                },
              },
            },
            stockItems: {
              select: { location: true, quantity: true },
            },
          },
          orderBy: { name: "asc" },
        }),
        PRODUCT_CACHE_TTL
      );
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
    const { product, prices, pricesCdf, measurePrices, halfPlatePrices, cost, costCdf, exchangeRate } = body;

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

    // Create prices for each space - use pricesCdf directly to avoid precision loss
    for (const [spaceId, priceUsd] of Object.entries(prices)) {
      if ((priceUsd as number) > 0) {
        // Use the exact CDF value from frontend if available, otherwise calculate
        const priceCdf = pricesCdf && pricesCdf[spaceId]
          ? pricesCdf[spaceId]
          : (priceUsd as number) * exchangeRate;

        await prisma.productPrice.create({
          data: {
            productId: newProduct.id,
            spaceId: spaceId,
            priceUsd: priceUsd as number,
            priceCdf: priceCdf,
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

    // Create cost - use costCdf directly if provided to avoid precision loss
    if (cost > 0) {
      const finalCostCdf = costCdf || cost * exchangeRate;
      await prisma.productCost.create({
        data: {
          productId: newProduct.id,
          unitCostUsd: cost,
          unitCostCdf: finalCostCdf,
          forUnit: product.saleUnit, // FIX: Use the actual sale unit
        },
      });

      // If needed, create cost for HALF_PLATE (50% of cost)
      if (halfPlatePrices && Object.keys(halfPlatePrices).length > 0) {
        await prisma.productCost.create({
          data: {
            productId: newProduct.id,
            unitCostUsd: cost / 2,
            unitCostCdf: finalCostCdf / 2,
            forUnit: "HALF_PLATE",
          },
        });
      }
    }

    // Bust product cache whenever a new product is created
    cache.invalidate(PRODUCT_CACHE_KEY);

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
