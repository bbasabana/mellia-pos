import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const investmentId = searchParams.get("investmentId")?.trim();

    const investments = await prisma.investment.findMany({
      orderBy: { date: "desc" },
      take: 100,
      select: {
        id: true,
        date: true,
        description: true,
        totalAmountCdf: true,
        expectedRevenueCdf: true,
        expectedRevenueVipCdf: true,
        expectedProfitCdf: true,
        expectedProfitVipCdf: true,
        movements: {
          where: { type: "IN" },
          select: {
            productId: true,
            quantity: true,
            costValue: true,
            product: {
              select: {
                id: true,
                name: true,
                type: true,
                saleUnit: true,
                costs: { select: { forUnit: true, unitCostUsd: true, unitCostCdf: true } },
                prices: {
                  select: {
                    priceUsd: true,
                    forUnit: true,
                    space: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (investments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          sessions: [],
          selected: null,
          dailySales: [],
          products: [],
        },
      });
    }

    const sortedAsc = [...investments].sort((a, b) => a.date.getTime() - b.date.getTime());

    const sessions = sortedAsc.map((inv, index) => {
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

    const selectedInv =
      investments.find((i) => i.id === investmentId) ?? investments[0];

    const selectedMeta = sessions.find((s) => s.id === selectedInv.id)!;
    const sessionStart = selectedMeta.sessionStart;
    const sessionEnd = selectedMeta.sessionEnd;

    let investedCdfTotal = 0;
    let investedCdfBeverage = 0;
    let investedCdfFood = 0;

    for (const mov of selectedInv.movements) {
      const amount = toNum(mov.costValue);
      investedCdfTotal += amount;
      if (mov.product.type === "BEVERAGE") investedCdfBeverage += amount;
      else if (mov.product.type === "FOOD") investedCdfFood += amount;
    }

    const saleItemsInSession = await prisma.saleItem.findMany({
      where: {
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
        product: { select: { type: true } },
        sale: { select: { createdAt: true } },
      },
    });

    let soldUsdTotal = 0;
    let soldUsdBeverage = 0;
    let soldUsdFood = 0;
    let soldCostUsd = 0;
    const soldByProduct = new Map<string, { qty: number; revenue: number; cost: number }>();
    const dailyMap = new Map<string, { beverage: number; food: number; total: number }>();

    for (const item of saleItemsInSession) {
      const revenue = toNum(item.totalPrice);
      const cost = toNum(item.unitCost) * toNum(item.quantity);
      soldUsdTotal += revenue;
      soldCostUsd += cost;

      if (item.product.type === "BEVERAGE") soldUsdBeverage += revenue;
      else if (item.product.type === "FOOD") soldUsdFood += revenue;

      const prev = soldByProduct.get(item.productId) ?? { qty: 0, revenue: 0, cost: 0 };
      soldByProduct.set(item.productId, {
        qty: prev.qty + toNum(item.quantity),
        revenue: prev.revenue + revenue,
        cost: prev.cost + cost,
      });

      const dayKey = item.sale.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dayKey) ?? { beverage: 0, food: 0, total: 0 };
      day.total += revenue;
      if (item.product.type === "BEVERAGE") day.beverage += revenue;
      else if (item.product.type === "FOOD") day.food += revenue;
      dailyMap.set(dayKey, day);
    }

    const soldProfitUsd = soldUsdTotal - soldCostUsd;

    const products = selectedInv.movements.map((mov) => {
      const p = mov.product;
      const purchasedQty = toNum(mov.quantity);
      const investedCdf = toNum(mov.costValue);
      const sold = soldByProduct.get(mov.productId) ?? { qty: 0, revenue: 0, cost: 0 };
      const remainingQty = Math.max(0, purchasedQty - sold.qty);

      const costEntry = p.costs.find((c) => c.forUnit === p.saleUnit) || p.costs[0];
      const unitCostUsd = toNum(costEntry?.unitCostUsd);
      const unitCostCdf = toNum(costEntry?.unitCostCdf);
      const terraceUsd = getTerracePriceUsd(p.prices);
      const vipUsd = getVipPriceUsd(p.prices, terraceUsd);

      const remainingValueCostCdf = remainingQty * (unitCostCdf || investedCdf / Math.max(purchasedQty, 1));
      const remainingTerraceUsd = remainingQty * terraceUsd;
      const remainingVipUsd = remainingQty * vipUsd;
      const remainingProfitTerraceUsd = remainingTerraceUsd - remainingQty * unitCostUsd;
      const remainingProfitVipUsd = remainingVipUsd - remainingQty * unitCostUsd;

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        unit: p.saleUnit,
        purchasedQty,
        investedCdf,
        soldQty: sold.qty,
        soldUsd: sold.revenue,
        soldProfitUsd: sold.revenue - sold.cost,
        remainingQty,
        remainingValueCostCdf,
        remainingTerraceUsd,
        remainingVipUsd,
        remainingProfitTerraceUsd,
        remainingProfitVipUsd,
      };
    });

    const remainingValueCostCdf = products.reduce((s, p) => s + p.remainingValueCostCdf, 0);
    const remainingTerraceUsd = products.reduce((s, p) => s + p.remainingTerraceUsd, 0);
    const remainingVipUsd = products.reduce((s, p) => s + p.remainingVipUsd, 0);
    const remainingProfitTerraceUsd = products.reduce((s, p) => s + p.remainingProfitTerraceUsd, 0);
    const remainingProfitVipUsd = products.reduce((s, p) => s + p.remainingProfitVipUsd, 0);

    const dailySales = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const sessionList = sessions
      .slice()
      .reverse()
      .map((s) => ({
        id: s.id,
        date: s.date,
        label: s.label,
        sessionStart: s.sessionStart,
        sessionEnd: s.sessionEnd,
        isActive: s.isActive,
      }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessionList,
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
          expectedRevenueTerraceCdf: toNum(selectedInv.expectedRevenueCdf),
          expectedRevenueVipCdf: toNum(selectedInv.expectedRevenueVipCdf),
          expectedProfitTerraceCdf: toNum(selectedInv.expectedProfitCdf),
          expectedProfitVipCdf: toNum(selectedInv.expectedProfitVipCdf),
          soldUsdTotal,
          soldUsdBeverage,
          soldUsdFood,
          soldProfitUsd,
          remainingValueCostCdf,
          remainingTerraceUsd,
          remainingVipUsd,
          remainingProfitTerraceUsd,
          remainingProfitVipUsd,
        },
        dailySales,
        products: products.sort((a, b) => b.remainingQty - a.remainingQty || a.name.localeCompare(b.name)),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Amelie API Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
