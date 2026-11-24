import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getStartDate, withEra } from "@/lib/cash-period";
import { getOpenDayPeriod } from "@/lib/cash-count";
import { salesDateFilter } from "@/lib/sales-filter";
import { spaceOf } from "@/lib/sale-space";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  MOBILE_MONEY: "Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
  AFRIMONEY: "Afrimoney",
  MPESA: "M-Pesa",
  LOYALTY_POINTS: "Points fidélité",
  SPLIT: "Mixte",
  OTHER: "Autre",
};

const MAX_TICKETS = 2000;

/**
 * GET: every completed sale of a period, oldest first, with its articles, the space of
 * each price and the totals — the data of the PDF sent to the staff to check their notes.
 *  - scope=open: the open day (since the last day closure), what the next closure counts;
 *  - otherwise the sales history filters: period / startDate / endDate / query / archives.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const sp = new URL(req.url).searchParams;
    const scope = sp.get("scope");
    const query = sp.get("query") || "";
    const archives = sp.get("archives") === "1";

    const where: Prisma.SaleWhereInput = { status: "COMPLETED" };
    let from: Date | null = null;
    let to: Date = new Date();

    if (scope === "open") {
      const open = await getOpenDayPeriod();
      from = open.periodStart;
      to = open.periodEnd;
      where.createdAt = { gte: from, lte: to };
    } else {
      const createdAt = salesDateFilter(sp.get("period"), sp.get("startDate"), sp.get("endDate"));
      if (createdAt) {
        where.createdAt = createdAt;
        from = (createdAt.gte as Date | undefined) ?? null;
        to = (createdAt.lte as Date | undefined) ?? to;
      }
      if (query) {
        where.OR = [
          { ticketNum: { contains: query, mode: "insensitive" } },
          { client: { name: { contains: query, mode: "insensitive" } } },
        ];
      }
    }

    const startDate = await getStartDate();
    const eraWhere = withEra(where, "createdAt", startDate, archives);
    if (!from && startDate && !archives) from = startDate;

    const [sales, cancelled, rateRow] = await Promise.all([
      prisma.sale.findMany({
        where: eraWhere,
        orderBy: { createdAt: "asc" },
        take: MAX_TICKETS,
        include: {
          user: { select: { name: true } },
          client: { select: { name: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  type: true,
                  prices: { select: { priceCdf: true, priceUsd: true, space: { select: { name: true } } } },
                },
              },
            },
          },
        },
      }),
      prisma.sale.aggregate({
        where: withEra({ ...where, status: "CANCELLED" }, "createdAt", startDate, archives),
        _sum: { totalCdf: true },
        _count: true,
      }),
      prisma.exchangeRate.findFirst({ where: { active: true }, orderBy: { effectiveDate: "desc" }, select: { rateUsdToCdf: true } }),
    ]);
    const rate = Number(rateRow?.rateUsdToCdf ?? 2850) || 2850;

    const bySpace = new Map<string, number>();
    const byProduct = new Map<string, { name: string; space: string; qty: number; totalCdf: number }>();
    let cashCdf = 0;
    let otherCdf = 0;
    let totalCdf = 0;
    let articles = 0;

    const tickets = sales.map((sale, index) => {
      const saleCdf = Number(sale.totalCdf) > 0 ? Number(sale.totalCdf) : Math.round(Number(sale.totalNet) * rate);
      totalCdf += saleCdf;
      if (sale.paymentMethod === "CASH") cashCdf += saleCdf;
      else otherCdf += saleCdf;

      const items = sale.items.map((item) => {
        const qty = Number(item.quantity);
        const unitUsd = Number(item.unitPrice);
        const unitCdf = Number(item.unitPriceCdf) > 0 ? Number(item.unitPriceCdf) : Math.round(unitUsd * rate);
        const lineCdf = Math.round(unitCdf * qty);
        const space = spaceOf(item.product.prices, unitCdf, unitUsd);
        articles += qty;
        bySpace.set(space, (bySpace.get(space) ?? 0) + lineCdf);
        const key = `${item.productId}|${space}`;
        const row = byProduct.get(key) ?? { name: item.product.name, space, qty: 0, totalCdf: 0 };
        row.qty += qty;
        row.totalCdf += lineCdf;
        byProduct.set(key, row);
        return { name: item.product.name, qty, space, unitCdf, totalCdf: lineCdf };
      });

      return {
        n: index + 1,
        ticketNum: sale.ticketNum,
        createdAt: sale.createdAt,
        cashier: sale.user?.name ?? "",
        client: sale.client?.name ?? null,
        payment: PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod,
        isCash: sale.paymentMethod === "CASH",
        discountCdf: Math.max(0, items.reduce((s, i) => s + i.totalCdf, 0) - saleCdf),
        totalCdf: saleCdf,
        items,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        scope: scope === "open" ? "open" : "filter",
        from,
        to,
        generatedAt: new Date(),
        generatedBy: session.user.name ?? "",
        truncated: sales.length >= MAX_TICKETS,
        tickets,
        totals: {
          count: tickets.length,
          articles,
          totalCdf,
          cashCdf,
          otherCdf,
          bySpace: [...bySpace.entries()].map(([space, cdf]) => ({ space, totalCdf: cdf })).sort((a, b) => b.totalCdf - a.totalCdf),
        },
        products: [...byProduct.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name)),
        cancelled: { count: cancelled._count, totalCdf: Number(cancelled._sum.totalCdf ?? 0) },
      },
    });
  } catch (error) {
    console.error("[SALES_REPORT_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
