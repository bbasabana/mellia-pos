import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type Period = "day" | "week" | "month" | "year" | "all";
type ProductFilter = "all" | "vendable" | "non_vendable";

function getPeriodStartDate(period: Period): Date | undefined {
  const now = new Date();

  if (period === "all") {
    return undefined;
  }

  if (period === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(now.getFullYear(), 0, 1);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "week") as Period;
    const productFilter = (searchParams.get("productFilter") || "all") as ProductFilter;
    const query = (searchParams.get("query") || "").trim();
    const threshold = Number(searchParams.get("threshold") || "5");

    const startDate = getPeriodStartDate(period);

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(productFilter === "vendable" ? { vendable: true } : {}),
        ...(productFilter === "non_vendable" ? { vendable: false } : {}),
        ...(query
          ? {
              name: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        vendable: true,
        saleUnit: true,
        stockItems: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          period,
          startDate,
          threshold,
          summary: {
            totalProducts: 0,
            lowStockCount: 0,
            productsToBuyCount: 0,
            purchasedInPeriod: 0,
            soldInPeriod: 0,
            totalCurrentStock: 0,
          },
          rows: [],
        },
      });
    }

    const productIds = products.map((p) => p.id);

    const [periodPurchases, totalPurchases, periodSales, totalSales] = await Promise.all([
      prisma.stockMovement.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
        },
        _sum: { quantity: true },
        _max: { createdAt: true },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          sale: {
            status: "COMPLETED",
            ...(startDate ? { createdAt: { gte: startDate } } : {}),
          },
        },
        _sum: { quantity: true },
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          sale: {
            status: "COMPLETED",
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const periodPurchaseMap = new Map(
      periodPurchases.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );
    const totalPurchaseMap = new Map(
      totalPurchases.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );
    const lastPurchaseDateMap = new Map(
      totalPurchases.map((item) => [item.productId, item._max.createdAt || null])
    );

    const periodSalesMap = new Map(
      periodSales.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );
    const totalSalesMap = new Map(
      totalSales.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );

    const rows = products.map((product) => {
      const currentStock = product.stockItems.reduce(
        (sum, stockItem) => sum + Number(stockItem.quantity || 0),
        0
      );

      const purchasedInPeriod = periodPurchaseMap.get(product.id) || 0;
      const purchasedTotal = totalPurchaseMap.get(product.id) || 0;
      const soldInPeriod = periodSalesMap.get(product.id) || 0;
      const soldTotal = totalSalesMap.get(product.id) || 0;
      const expectedStock = purchasedTotal - soldTotal;
      const stockGap = currentStock - expectedStock;
      const lastPurchaseAt = lastPurchaseDateMap.get(product.id) || null;

      return {
        id: product.id,
        name: product.name,
        type: product.type,
        vendable: product.vendable,
        unit: product.saleUnit,
        purchasedInPeriod,
        purchasedTotal,
        soldInPeriod,
        soldTotal,
        expectedStock,
        currentStock,
        stockGap,
        lastPurchaseAt,
        needsRestock: currentStock <= threshold,
      };
    });

    const summary = {
      totalProducts: rows.length,
      lowStockCount: rows.filter((row) => row.currentStock <= threshold).length,
      productsToBuyCount: rows.filter((row) => row.needsRestock).length,
      purchasedInPeriod: rows.reduce((sum, row) => sum + row.purchasedInPeriod, 0),
      soldInPeriod: rows.reduce((sum, row) => sum + row.soldInPeriod, 0),
      totalCurrentStock: rows.reduce((sum, row) => sum + row.currentStock, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,
        threshold,
        summary,
        rows: rows.sort((a, b) => a.currentStock - b.currentStock || a.name.localeCompare(b.name)),
      },
    });
  } catch (error: any) {
    console.error("Mini Inventory API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
