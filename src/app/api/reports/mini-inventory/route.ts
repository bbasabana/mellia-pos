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

function getDefaultTargetDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayRange(targetDate: string) {
  const start = new Date(`${targetDate}T00:00:00`);
  const end = new Date(`${targetDate}T23:59:59.999`);
  return { start, end };
}

function toNumberSafe(value: any): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTerracePriceUsd(prices: Array<{ priceUsd: any; space: { name: string } }>): number {
  const standardPrice = prices.find((p) => {
    const name = p.space.name.toLowerCase().trim();
    return name === "terrasse" || name === "salle" || name === "standard";
  });
  const fallback = prices.find((p) => !p.space.name.toLowerCase().includes("vip"));
  return toNumberSafe(standardPrice?.priceUsd ?? fallback?.priceUsd ?? 0);
}

function getVipPriceUsd(prices: Array<{ priceUsd: any; space: { name: string } }>, terracePrice: number): number {
  const vipPrice = prices.find((p) => p.space.name.toLowerCase().includes("vip"));
  return toNumberSafe(vipPrice?.priceUsd ?? terracePrice);
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
    const productId = (searchParams.get("productId") || "").trim();
    const thresholdRaw = Number(searchParams.get("threshold") || "5");
    const threshold = Number.isFinite(thresholdRaw) && thresholdRaw >= 0 ? thresholdRaw : 5;
    const targetDate = searchParams.get("targetDate") || getDefaultTargetDateString();

    const startDate = getPeriodStartDate(period);
    const { start: targetDateStart, end: targetDateEnd } = getDayRange(targetDate);

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(productId ? { id: productId } : {}),
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
        costs: {
          select: {
            forUnit: true,
            unitCostUsd: true,
          },
        },
        prices: {
          select: {
            forUnit: true,
            priceUsd: true,
            space: {
              select: {
                name: true,
              },
            },
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
          targetDate,
          threshold,
          summary: {
            totalProducts: 0,
            lowStockCount: 0,
            productsToBuyCount: 0,
            purchasedInPeriod: 0,
            soldInPeriod: 0,
            totalCurrentStock: 0,
            purchasedOnDate: 0,
            soldOnDate: 0,
            remainingOnDate: 0,
          },
          financialSummary: {
            investedCdfTotal: 0,
            investedCdfBeverage: 0,
            investedCdfFood: 0,
            soldUsdTotal: 0,
            soldUsdBeverage: 0,
            soldUsdFood: 0,
            remainingRevenueTerraceUsd: 0,
            remainingProfitTerraceUsd: 0,
            remainingRevenueVipUsd: 0,
            remainingProfitVipUsd: 0,
          },
          lastInvestment: null,
          rows: [],
        },
      });
    }

    const productIds = products.map((p) => p.id);

    const [
      periodPurchases,
      totalPurchases,
      periodSales,
      totalSales,
      datePurchases,
      dateSales,
      purchasesUntilDate,
      salesUntilDate,
      periodPurchaseMovements,
      periodSaleItems,
      allPurchasesDesc,
      latestInvestment,
    ] = await Promise.all([
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
      prisma.stockMovement.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
          createdAt: {
            gte: targetDateStart,
            lte: targetDateEnd,
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
            createdAt: {
              gte: targetDateStart,
              lte: targetDateEnd,
            },
          },
        },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
          createdAt: {
            lte: targetDateEnd,
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
            createdAt: {
              lte: targetDateEnd,
            },
          },
        },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.findMany({
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        select: {
          productId: true,
          costValue: true,
          product: {
            select: {
              type: true,
            },
          },
        },
      }),
      prisma.saleItem.findMany({
        where: {
          productId: { in: productIds },
          sale: {
            status: "COMPLETED",
            ...(startDate ? { createdAt: { gte: startDate } } : {}),
          },
        },
        select: {
          productId: true,
          totalPrice: true,
          product: {
            select: {
              type: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        where: {
          productId: { in: productIds },
          type: "IN",
          investmentId: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: {
          productId: true,
          quantity: true,
          createdAt: true,
        },
      }),
      prisma.investment.findFirst({
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          totalAmountCdf: true,
          expectedRevenueCdf: true,
          expectedRevenueVipCdf: true,
          expectedProfitCdf: true,
          expectedProfitVipCdf: true,
          movements: {
            where: { type: "IN" },
            select: {
              quantity: true,
              costValue: true,
              product: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
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
    const datePurchasesMap = new Map(
      datePurchases.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );
    const dateSalesMap = new Map(dateSales.map((item) => [item.productId, Number(item._sum.quantity || 0)]));
    const purchasesUntilDateMap = new Map(
      purchasesUntilDate.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );
    const salesUntilDateMap = new Map(
      salesUntilDate.map((item) => [item.productId, Number(item._sum.quantity || 0)])
    );

    const lastPurchaseByProduct = new Map<
      string,
      { createdAt: Date; quantity: number }
    >();
    for (const movement of allPurchasesDesc) {
      if (!lastPurchaseByProduct.has(movement.productId)) {
        lastPurchaseByProduct.set(movement.productId, {
          createdAt: movement.createdAt,
          quantity: toNumberSafe(movement.quantity),
        });
      }
    }

    let earliestLastPurchaseDate: Date | null = null;
    for (const entry of lastPurchaseByProduct.values()) {
      if (!earliestLastPurchaseDate || entry.createdAt < earliestLastPurchaseDate) {
        earliestLastPurchaseDate = entry.createdAt;
      }
    }

    const saleItemsSinceEarliest = earliestLastPurchaseDate
      ? await prisma.saleItem.findMany({
          where: {
            productId: { in: productIds },
            sale: {
              status: "COMPLETED",
              createdAt: { gte: earliestLastPurchaseDate },
            },
          },
          select: {
            productId: true,
            quantity: true,
            sale: {
              select: {
                createdAt: true,
              },
            },
          },
        })
      : [];

    const soldSinceLastPurchaseMap = new Map<string, number>();
    for (const item of saleItemsSinceEarliest) {
      const lastPurchase = lastPurchaseByProduct.get(item.productId);
      if (!lastPurchase) continue;
      if (item.sale.createdAt < lastPurchase.createdAt) continue;
      const current = soldSinceLastPurchaseMap.get(item.productId) || 0;
      soldSinceLastPurchaseMap.set(item.productId, current + toNumberSafe(item.quantity));
    }

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
      const purchasedOnDate = datePurchasesMap.get(product.id) || 0;
      const soldOnDate = dateSalesMap.get(product.id) || 0;
      const purchasedToDate = purchasesUntilDateMap.get(product.id) || 0;
      const soldToDate = salesUntilDateMap.get(product.id) || 0;
      const remainingOnDate = purchasedToDate - soldToDate;
      const lastPurchaseMeta = lastPurchaseByProduct.get(product.id);
      const lastPurchaseQuantity = lastPurchaseMeta?.quantity || 0;
      const soldSinceLastPurchase = soldSinceLastPurchaseMap.get(product.id) || 0;
      const remainingFromLastPurchase = lastPurchaseQuantity - soldSinceLastPurchase;
      const costForUnit =
        product.costs.find((cost) => cost.forUnit === product.saleUnit) || product.costs[0];
      const unitCostUsd = toNumberSafe(costForUnit?.unitCostUsd || 0);
      const terracePriceUsd = getTerracePriceUsd(product.prices as any);
      const vipPriceUsd = getVipPriceUsd(product.prices as any, terracePriceUsd);
      const remainingRevenueTerraceUsd = currentStock * terracePriceUsd;
      const remainingRevenueVipUsd = currentStock * vipPriceUsd;
      const remainingProfitTerraceUsd = remainingRevenueTerraceUsd - currentStock * unitCostUsd;
      const remainingProfitVipUsd = remainingRevenueVipUsd - currentStock * unitCostUsd;

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
        lastPurchaseQuantity,
        soldSinceLastPurchase,
        remainingFromLastPurchase,
        remainingRevenueTerraceUsd,
        remainingRevenueVipUsd,
        remainingProfitTerraceUsd,
        remainingProfitVipUsd,
        purchasedOnDate,
        soldOnDate,
        remainingOnDate,
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
      purchasedOnDate: rows.reduce((sum, row) => sum + row.purchasedOnDate, 0),
      soldOnDate: rows.reduce((sum, row) => sum + row.soldOnDate, 0),
      remainingOnDate: rows.reduce((sum, row) => sum + row.remainingOnDate, 0),
    };

    const financialSummary = {
      investedCdfTotal: 0,
      investedCdfBeverage: 0,
      investedCdfFood: 0,
      soldUsdTotal: 0,
      soldUsdBeverage: 0,
      soldUsdFood: 0,
      remainingRevenueTerraceUsd: rows.reduce((sum, row) => sum + row.remainingRevenueTerraceUsd, 0),
      remainingProfitTerraceUsd: rows.reduce((sum, row) => sum + row.remainingProfitTerraceUsd, 0),
      remainingRevenueVipUsd: rows.reduce((sum, row) => sum + row.remainingRevenueVipUsd, 0),
      remainingProfitVipUsd: rows.reduce((sum, row) => sum + row.remainingProfitVipUsd, 0),
    };

    for (const movement of periodPurchaseMovements) {
      const amount = toNumberSafe(movement.costValue);
      financialSummary.investedCdfTotal += amount;
      if (movement.product.type === "BEVERAGE") {
        financialSummary.investedCdfBeverage += amount;
      } else if (movement.product.type === "FOOD") {
        financialSummary.investedCdfFood += amount;
      }
    }

    for (const item of periodSaleItems) {
      const revenue = toNumberSafe(item.totalPrice);
      financialSummary.soldUsdTotal += revenue;
      if (item.product.type === "BEVERAGE") {
        financialSummary.soldUsdBeverage += revenue;
      } else if (item.product.type === "FOOD") {
        financialSummary.soldUsdFood += revenue;
      }
    }

    let lastInvestmentSummary: {
      id: string;
      date: Date;
      investedCdfTotal: number;
      investedCdfBeverage: number;
      investedCdfFood: number;
      expectedRevenueTerraceCdf: number;
      expectedRevenueVipCdf: number;
      expectedProfitTerraceCdf: number;
      expectedProfitVipCdf: number;
      salesSincePurchaseUsdTotal: number;
      salesSincePurchaseUsdBeverage: number;
      salesSincePurchaseUsdFood: number;
    } | null = null;

    if (latestInvestment) {
      let investedCdfBeverage = 0;
      let investedCdfFood = 0;

      for (const movement of latestInvestment.movements) {
        const amount = toNumberSafe(movement.costValue);
        if (movement.product.type === "BEVERAGE") {
          investedCdfBeverage += amount;
        } else if (movement.product.type === "FOOD") {
          investedCdfFood += amount;
        }
      }

      const salesSinceLatestInvestment = await prisma.saleItem.findMany({
        where: {
          productId: { in: productIds },
          sale: {
            status: "COMPLETED",
            createdAt: { gte: latestInvestment.date },
          },
        },
        select: {
          totalPrice: true,
          product: {
            select: {
              type: true,
            },
          },
        },
      });

      let salesSincePurchaseUsdTotal = 0;
      let salesSincePurchaseUsdBeverage = 0;
      let salesSincePurchaseUsdFood = 0;

      for (const saleItem of salesSinceLatestInvestment) {
        const amount = toNumberSafe(saleItem.totalPrice);
        salesSincePurchaseUsdTotal += amount;
        if (saleItem.product.type === "BEVERAGE") {
          salesSincePurchaseUsdBeverage += amount;
        } else if (saleItem.product.type === "FOOD") {
          salesSincePurchaseUsdFood += amount;
        }
      }

      lastInvestmentSummary = {
        id: latestInvestment.id,
        date: latestInvestment.date,
        investedCdfTotal: toNumberSafe(latestInvestment.totalAmountCdf),
        investedCdfBeverage,
        investedCdfFood,
        expectedRevenueTerraceCdf: toNumberSafe(latestInvestment.expectedRevenueCdf),
        expectedRevenueVipCdf: toNumberSafe(latestInvestment.expectedRevenueVipCdf),
        expectedProfitTerraceCdf: toNumberSafe(latestInvestment.expectedProfitCdf),
        expectedProfitVipCdf: toNumberSafe(latestInvestment.expectedProfitVipCdf),
        salesSincePurchaseUsdTotal,
        salesSincePurchaseUsdBeverage,
        salesSincePurchaseUsdFood,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,
        targetDate,
        threshold,
        summary,
        financialSummary,
        lastInvestment: lastInvestmentSummary,
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
