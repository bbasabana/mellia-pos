import { prisma } from "@/lib/prisma";

type MovementType = "IN" | "OUT" | "TRANSFER" | "LOSS" | "ADJUSTMENT";

function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getTerracePriceUsd(
  prices: Array<{ priceUsd: unknown; space: { name: string } }>
): number {
  const standard = prices.find((p) => {
    const name = p.space.name.toLowerCase().trim();
    return name === "terrasse" || name === "salle" || name === "standard";
  });
  const fallback = prices.find((p) => !p.space.name.toLowerCase().includes("vip"));
  return toNum(standard?.priceUsd ?? fallback?.priceUsd ?? 0);
}

function getVipPriceUsd(
  prices: Array<{ priceUsd: unknown; space: { name: string } }>,
  terrace: number
): number {
  const vip = prices.find((p) => p.space.name.toLowerCase().includes("vip"));
  return toNum(vip?.priceUsd ?? terrace);
}

function movementDelta(movement: {
  type: MovementType;
  quantity: unknown;
  fromLocation: string | null;
  toLocation: string | null;
}): number {
  const qty = toNum(movement.quantity);
  if (movement.type === "IN") return qty;
  if (movement.type === "OUT") return -qty;
  if (movement.type === "LOSS") return -qty;
  if (movement.type === "TRANSFER") return 0;
  if (movement.type === "ADJUSTMENT") {
    const hasFrom = !!movement.fromLocation;
    const hasTo = !!movement.toLocation;
    if (hasFrom && !hasTo) return -qty;
    if (!hasFrom && hasTo) return qty;
    return 0;
  }
  return 0;
}

export type AmelieSessionOption = {
  id: string;
  date: Date;
  label: string;
  sessionStart: Date;
  sessionEnd: Date;
  isActive: boolean;
};

export type AmelieProductRow = {
  id: string;
  name: string;
  type: string;
  unit: string;
  openingQty: number;
  purchasedQty: number;
  availableQty: number;
  investedCdf: number;
  soldQty: number;
  soldUsd: number;
  soldProfitUsd: number;
  remainingQty: number;
  remainingValueCostCdf: number;
  remainingTerraceUsd: number;
  remainingVipUsd: number;
  remainingProfitTerraceUsd: number;
  remainingProfitVipUsd: number;
};

export type AmelieReportData = {
  sessions: AmelieSessionOption[];
  selected: {
    investmentId: string;
    date: Date;
    label: string;
    sessionStart: Date;
    sessionEnd: Date;
    isActive: boolean;
    investedCdfTotal: number;
    investedCdfBeverage: number;
    investedCdfFood: number;
    expectedRevenueTerraceCdf: number;
    expectedRevenueVipCdf: number;
    expectedProfitTerraceCdf: number;
    expectedProfitVipCdf: number;
    soldUsdTotal: number;
    soldUsdBeverage: number;
    soldUsdFood: number;
    soldProfitUsd: number;
    soldQtyTotal: number;
    soldQtyBeverage: number;
    soldQtyFood: number;
    openingQtyTotal: number;
    purchasedQtyTotal: number;
    availableQtyTotal: number;
    remainingQtyTotal: number;
    remainingValueCostCdf: number;
    remainingTerraceUsd: number;
    remainingVipUsd: number;
    remainingProfitTerraceUsd: number;
    remainingProfitVipUsd: number;
    topProductByQty: {
      id: string;
      name: string;
      qty: number;
      revenueUsd: number;
    } | null;
    topProductByRevenue: {
      id: string;
      name: string;
      qty: number;
      revenueUsd: number;
    } | null;
  } | null;
  dailySales: Array<{ date: string; beverage: number; food: number; total: number }>;
  products: AmelieProductRow[];
};

function emptySelected(
  selectedInv: { id: string; date: Date },
  selectedMeta: AmelieSessionOption
): NonNullable<AmelieReportData["selected"]> {
  return {
    investmentId: selectedInv.id,
    date: selectedInv.date,
    label: selectedMeta.label,
    sessionStart: selectedMeta.sessionStart,
    sessionEnd: selectedMeta.sessionEnd,
    isActive: selectedMeta.isActive,
    investedCdfTotal: 0,
    investedCdfBeverage: 0,
    investedCdfFood: 0,
    expectedRevenueTerraceCdf: 0,
    expectedRevenueVipCdf: 0,
    expectedProfitTerraceCdf: 0,
    expectedProfitVipCdf: 0,
    soldUsdTotal: 0,
    soldUsdBeverage: 0,
    soldUsdFood: 0,
    soldProfitUsd: 0,
    soldQtyTotal: 0,
    soldQtyBeverage: 0,
    soldQtyFood: 0,
    openingQtyTotal: 0,
    purchasedQtyTotal: 0,
    availableQtyTotal: 0,
    remainingQtyTotal: 0,
    remainingValueCostCdf: 0,
    remainingTerraceUsd: 0,
    remainingVipUsd: 0,
    remainingProfitTerraceUsd: 0,
    remainingProfitVipUsd: 0,
    topProductByQty: null,
    topProductByRevenue: null,
  };
}

export async function buildAmelieReport(investmentId?: string): Promise<AmelieReportData> {
  const investments = await prisma.investment.findMany({
    orderBy: { date: "desc" },
    take: 200,
    select: {
      id: true,
      date: true,
      description: true,
    },
  });

  if (investments.length === 0) {
    return {
      sessions: [],
      selected: null,
      dailySales: [],
      products: [],
    };
  }

  const sortedAsc = [...investments].sort((a, b) => a.date.getTime() - b.date.getTime());

  const sessions: AmelieSessionOption[] = sortedAsc.map((inv, index) => {
    const sessionStart = startOfDay(inv.date);
    const next = sortedAsc[index + 1];
    const sessionEnd = next ? endOfDay(new Date(next.date.getTime() - 86400000)) : endOfDay(new Date());

    return {
      id: inv.id,
      date: inv.date,
      label: inv.description || `Achat du ${inv.date.toLocaleDateString("fr-FR")}`,
      sessionStart,
      sessionEnd,
      isActive: !next,
    };
  });

  const selectedInv = investments.find((i) => i.id === investmentId) ?? investments[0];
  const selectedMeta = sessions.find((s) => s.id === selectedInv.id)!;
  const sessionStart = selectedMeta.sessionStart;
  const sessionEnd = selectedMeta.sessionEnd;

  const allProducts = await prisma.product.findMany({
    where: {
      active: true,
      vendable: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      saleUnit: true,
      costs: {
        select: {
          forUnit: true,
          unitCostUsd: true,
          unitCostCdf: true,
        },
      },
      prices: {
        select: {
          priceUsd: true,
          forUnit: true,
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

  const productIds = allProducts.map((p) => p.id);

  if (productIds.length === 0) {
    return {
      sessions: sessions.slice().reverse(),
      selected: emptySelected(selectedInv, selectedMeta),
      dailySales: [],
      products: [],
    };
  }

  const sessionInvestments = await prisma.investment.findMany({
    where: {
      date: { gte: sessionStart, lte: sessionEnd },
    },
    select: {
      id: true,
      expectedRevenueCdf: true,
      expectedRevenueVipCdf: true,
      expectedProfitCdf: true,
      expectedProfitVipCdf: true,
    },
  });

  const sessionInvestmentIds = sessionInvestments.map((inv) => inv.id);

  const [sessionPurchaseMovements, salesInSession, movementsBeforeSession] = await Promise.all([
    sessionInvestmentIds.length > 0
      ? prisma.stockMovement.findMany({
          where: {
            type: "IN",
            investmentId: { in: sessionInvestmentIds },
            productId: { in: productIds },
          },
          select: {
            productId: true,
            quantity: true,
            costValue: true,
            product: {
              select: {
                type: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.saleItem.findMany({
      where: {
        productId: { in: productIds },
        sale: {
          status: "COMPLETED",
          createdAt: { gte: sessionStart, lte: sessionEnd },
        },
      },
      select: {
        productId: true,
        quantity: true,
        totalPrice: true,
        unitCost: true,
        sale: {
          select: {
            createdAt: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    }),
    prisma.stockMovement.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { lt: sessionStart },
      },
      select: {
        productId: true,
        type: true,
        quantity: true,
        fromLocation: true,
        toLocation: true,
      },
    }),
  ]);

  const openingStockMap = new Map<string, number>();
  for (const product of allProducts) {
    openingStockMap.set(product.id, 0);
  }

  for (const movement of movementsBeforeSession) {
    const delta = movementDelta({
      type: movement.type as MovementType,
      quantity: movement.quantity,
      fromLocation: movement.fromLocation,
      toLocation: movement.toLocation,
    });
    openingStockMap.set(
      movement.productId,
      (openingStockMap.get(movement.productId) || 0) + delta
    );
  }

  const purchaseByProduct = new Map<string, { qty: number; costCdf: number }>();
  let investedCdfTotal = 0;
  let investedCdfBeverage = 0;
  let investedCdfFood = 0;

  for (const movement of sessionPurchaseMovements) {
    const qty = toNum(movement.quantity);
    const costCdf = toNum(movement.costValue);
    const prev = purchaseByProduct.get(movement.productId) || { qty: 0, costCdf: 0 };
    purchaseByProduct.set(movement.productId, {
      qty: prev.qty + qty,
      costCdf: prev.costCdf + costCdf,
    });

    investedCdfTotal += costCdf;
    if (movement.product.type === "BEVERAGE") investedCdfBeverage += costCdf;
    else if (movement.product.type === "FOOD") investedCdfFood += costCdf;
  }

  const soldByProduct = new Map<
    string,
    { qty: number; revenue: number; cost: number; name: string }
  >();
  const dailyMap = new Map<string, { beverage: number; food: number; total: number }>();

  let soldUsdTotal = 0;
  let soldUsdBeverage = 0;
  let soldUsdFood = 0;
  let soldCostUsd = 0;
  let soldQtyTotal = 0;
  let soldQtyBeverage = 0;
  let soldQtyFood = 0;

  for (const item of salesInSession) {
    const qty = toNum(item.quantity);
    const revenue = toNum(item.totalPrice);
    const cost = toNum(item.unitCost) * qty;

    soldUsdTotal += revenue;
    soldCostUsd += cost;
    soldQtyTotal += qty;

    if (item.product.type === "BEVERAGE") {
      soldUsdBeverage += revenue;
      soldQtyBeverage += qty;
    } else if (item.product.type === "FOOD") {
      soldUsdFood += revenue;
      soldQtyFood += qty;
    }

    const prev = soldByProduct.get(item.productId) || {
      qty: 0,
      revenue: 0,
      cost: 0,
      name: item.product.name,
    };
    soldByProduct.set(item.productId, {
      qty: prev.qty + qty,
      revenue: prev.revenue + revenue,
      cost: prev.cost + cost,
      name: prev.name,
    });

    const dayKey = item.sale.createdAt.toISOString().slice(0, 10);
    const day = dailyMap.get(dayKey) || { beverage: 0, food: 0, total: 0 };
    day.total += revenue;
    if (item.product.type === "BEVERAGE") day.beverage += revenue;
    else if (item.product.type === "FOOD") day.food += revenue;
    dailyMap.set(dayKey, day);
  }

  const soldProfitUsd = soldUsdTotal - soldCostUsd;

  const products: AmelieProductRow[] = [];
  for (const product of allProducts) {
    const openingQty = Math.max(0, openingStockMap.get(product.id) || 0);
    const purchased = purchaseByProduct.get(product.id) || { qty: 0, costCdf: 0 };
    const purchasedQty = purchased.qty;
    const investedCdf = purchased.costCdf;
    const availableQty = openingQty + purchasedQty;

    const soldData = soldByProduct.get(product.id) || {
      qty: 0,
      revenue: 0,
      cost: 0,
      name: product.name,
    };
    const soldQty = soldData.qty;
    const soldUsd = soldData.revenue;
    const soldProfit = soldData.revenue - soldData.cost;
    const remainingQty = Math.max(0, availableQty - soldQty);

    const costEntry = product.costs.find((c) => c.forUnit === product.saleUnit) || product.costs[0];
    const unitCostUsd = toNum(costEntry?.unitCostUsd);
    const unitCostCdf = toNum(costEntry?.unitCostCdf);
    const terraceUsd = getTerracePriceUsd(product.prices);
    const vipUsd = getVipPriceUsd(product.prices, terraceUsd);

    const remainingValueCostCdf = remainingQty * unitCostCdf;
    const remainingTerraceUsd = remainingQty * terraceUsd;
    const remainingVipUsd = remainingQty * vipUsd;
    const remainingProfitTerraceUsd = remainingTerraceUsd - remainingQty * unitCostUsd;
    const remainingProfitVipUsd = remainingVipUsd - remainingQty * unitCostUsd;

    products.push({
      id: product.id,
      name: product.name,
      type: product.type,
      unit: product.saleUnit,
      openingQty,
      purchasedQty,
      availableQty,
      investedCdf,
      soldQty,
      soldUsd,
      soldProfitUsd: soldProfit,
      remainingQty,
      remainingValueCostCdf,
      remainingTerraceUsd,
      remainingVipUsd,
      remainingProfitTerraceUsd,
      remainingProfitVipUsd,
    });
  }

  const topByQty = [...soldByProduct.entries()].sort(
    (a, b) => b[1].qty - a[1].qty || b[1].revenue - a[1].revenue
  )[0];
  const topByRevenue = [...soldByProduct.entries()].sort(
    (a, b) => b[1].revenue - a[1].revenue || b[1].qty - a[1].qty
  )[0];

  const investmentsExpected = sessionInvestments.reduce(
    (acc, inv) => {
      acc.revTerrace += toNum(inv.expectedRevenueCdf);
      acc.revVip += toNum(inv.expectedRevenueVipCdf);
      acc.profitTerrace += toNum(inv.expectedProfitCdf);
      acc.profitVip += toNum(inv.expectedProfitVipCdf);
      return acc;
    },
    { revTerrace: 0, revVip: 0, profitTerrace: 0, profitVip: 0 }
  );

  const remainingValueCostCdf = products.reduce((sum, p) => sum + p.remainingValueCostCdf, 0);
  const remainingTerraceUsd = products.reduce((sum, p) => sum + p.remainingTerraceUsd, 0);
  const remainingVipUsd = products.reduce((sum, p) => sum + p.remainingVipUsd, 0);
  const remainingProfitTerraceUsd = products.reduce((sum, p) => sum + p.remainingProfitTerraceUsd, 0);
  const remainingProfitVipUsd = products.reduce((sum, p) => sum + p.remainingProfitVipUsd, 0);
  const openingQtyTotal = products.reduce((sum, p) => sum + p.openingQty, 0);
  const purchasedQtyTotal = products.reduce((sum, p) => sum + p.purchasedQty, 0);
  const availableQtyTotal = products.reduce((sum, p) => sum + p.availableQty, 0);
  const remainingQtyTotal = products.reduce((sum, p) => sum + p.remainingQty, 0);

  const dailySales = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return {
    sessions: sessions.slice().reverse(),
    selected: {
      investmentId: selectedInv.id,
      date: selectedInv.date,
      label: selectedMeta.label,
      sessionStart,
      sessionEnd,
      isActive: selectedMeta.isActive,
      investedCdfTotal,
      investedCdfBeverage,
      investedCdfFood,
      expectedRevenueTerraceCdf: investmentsExpected.revTerrace,
      expectedRevenueVipCdf: investmentsExpected.revVip,
      expectedProfitTerraceCdf: investmentsExpected.profitTerrace,
      expectedProfitVipCdf: investmentsExpected.profitVip,
      soldUsdTotal,
      soldUsdBeverage,
      soldUsdFood,
      soldProfitUsd,
      soldQtyTotal,
      soldQtyBeverage,
      soldQtyFood,
      openingQtyTotal,
      purchasedQtyTotal,
      availableQtyTotal,
      remainingQtyTotal,
      remainingValueCostCdf,
      remainingTerraceUsd,
      remainingVipUsd,
      remainingProfitTerraceUsd,
      remainingProfitVipUsd,
      topProductByQty: topByQty
        ? {
            id: topByQty[0],
            name: topByQty[1].name,
            qty: topByQty[1].qty,
            revenueUsd: topByQty[1].revenue,
          }
        : null,
      topProductByRevenue: topByRevenue
        ? {
            id: topByRevenue[0],
            name: topByRevenue[1].name,
            qty: topByRevenue[1].qty,
            revenueUsd: topByRevenue[1].revenue,
          }
        : null,
    },
    dailySales,
    products: products.sort(
      (a, b) =>
        b.soldQty - a.soldQty ||
        b.purchasedQty - a.purchasedQty ||
        b.openingQty - a.openingQty ||
        a.name.localeCompare(b.name)
    ),
  };
}
