import { prisma } from "@/lib/prisma";
import { expectedCash, getCashExpectation, getOpenDayPeriod } from "@/lib/cash-count";
import { ADJUSTMENT_CATEGORY_FILTER } from "@/lib/cash-period";
import { OTHER_PRICE, spaceOf } from "@/lib/sale-space";

/**
 * Checks of the open day before it is closed: when the money counted does not match the
 * sales, these are the usual causes — a sale rung up twice, sales whose total is exactly the
 * missing amount (often missing from the paper notes), a payment recorded as cash that was
 * mobile money (or the reverse), a price typed by hand, a cancelled ticket, an expense paid
 * from the drawer.
 */

export type TicketBrief = {
  id: string;
  ticketNum: string;
  createdAt: Date;
  totalCdf: number;
  payment: string;
  isCash: boolean;
  cashier: string;
  items: string;
};

const DUPLICATE_WINDOW_MS = 30 * 60_000;
const MAX_MATCHES = 6;

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  MOBILE_MONEY: "Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
  AFRIMONEY: "Afrimoney",
  MPESA: "M-Pesa",
  LOYALTY_POINTS: "Points",
  SPLIT: "Mixte",
  OTHER: "Autre",
};

const n = (v: unknown) => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

export async function checkOpenDay(countedCdf: number | null) {
  const open = await getOpenDayPeriod();
  const range = { gte: open.periodStart, lt: open.periodEnd };

  const [expectation, sales, cancelled, expenses, rateRow] = await Promise.all([
    getCashExpectation(open.periodStart, open.periodEnd),
    prisma.sale.findMany({
      where: { status: "COMPLETED", createdAt: range },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                prices: { select: { priceCdf: true, priceUsd: true, space: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.sale.findMany({
      where: { status: "CANCELLED", createdAt: range },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.expense.findMany({
      where: { date: range, source: "CASH_REGISTER", NOT: ADJUSTMENT_CATEGORY_FILTER },
      orderBy: { date: "asc" },
      select: { id: true, description: true, amount: true, date: true, category: { select: { name: true } } },
    }),
    prisma.exchangeRate.findFirst({ where: { active: true }, orderBy: { effectiveDate: "desc" }, select: { rateUsdToCdf: true } }),
  ]);
  const rate = n(rateRow?.rateUsdToCdf) || 2850;
  const expectedCdf = expectedCash(expectation, open.openingFloatCdf);
  const gapCdf = countedCdf === null ? null : countedCdf - expectedCdf;

  const totalOf = (s: { totalCdf: unknown; totalNet: unknown }) => (n(s.totalCdf) > 0 ? Math.round(n(s.totalCdf)) : Math.round(n(s.totalNet) * rate));
  const brief = (s: (typeof sales)[number] | (typeof cancelled)[number]): TicketBrief => ({
    id: s.id,
    ticketNum: s.ticketNum,
    createdAt: s.createdAt,
    totalCdf: totalOf(s),
    payment: PAYMENT_LABEL[s.paymentMethod] ?? s.paymentMethod,
    isCash: s.paymentMethod === "CASH",
    cashier: s.user?.name ?? "",
    items: s.items.map((i) => `${n(i.quantity)}× ${i.product.name}`).join(", "),
  });
  const tickets = sales.map(brief);

  // Same articles, same quantities and prices, within 30 minutes: probably rung up twice.
  const signature = (s: (typeof sales)[number]) =>
    s.items
      .map((i) => `${i.productId}:${n(i.quantity)}:${Math.round(n(i.unitPriceCdf))}`)
      .sort()
      .join("|");
  const duplicates: Array<{ first: TicketBrief; second: TicketBrief; minutes: number }> = [];
  const lastBySignature = new Map<string, number>();
  sales.forEach((s, index) => {
    const sig = signature(s);
    const prev = lastBySignature.get(sig);
    if (prev !== undefined) {
      const gap = s.createdAt.getTime() - sales[prev].createdAt.getTime();
      if (gap <= DUPLICATE_WINDOW_MS) {
        duplicates.push({ first: tickets[prev], second: tickets[index], minutes: Math.round(gap / 60_000) });
      }
    }
    lastBySignature.set(sig, index);
  });

  // A shortfall equal to one ticket, or to two tickets together.
  const singles: TicketBrief[] = [];
  const pairs: Array<[TicketBrief, TicketBrief]> = [];
  if (gapCdf !== null && gapCdf < 0) {
    const missing = -gapCdf;
    const cash = tickets.filter((t) => t.isCash);
    for (const t of cash) if (t.totalCdf === missing && singles.length < MAX_MATCHES) singles.push(t);
    outer: for (let i = 0; i < cash.length; i++) {
      for (let j = i + 1; j < cash.length; j++) {
        if (cash[i].totalCdf + cash[j].totalCdf === missing) {
          pairs.push([cash[i], cash[j]]);
          if (pairs.length >= MAX_MATCHES) break outer;
        }
      }
    }
  }

  // Lines whose price matches neither the Terrasse nor the VIP price.
  const editedPrices = sales.flatMap((s, index) =>
    s.items
      .filter((i) => {
        const unitCdf = n(i.unitPriceCdf) > 0 ? n(i.unitPriceCdf) : n(i.unitPrice) * rate;
        return spaceOf(i.product.prices, unitCdf, n(i.unitPrice)) === OTHER_PRICE;
      })
      .map((i) => {
        const standard = i.product.prices.map((p) => Math.round(n(p.priceCdf))).filter((v) => v > 0);
        return {
          ticket: tickets[index],
          name: i.product.name,
          qty: n(i.quantity),
          unitCdf: Math.round(n(i.unitPriceCdf)),
          usualCdf: standard,
        };
      })
  );

  const byCashier = new Map<string, { cashier: string; count: number; cashCdf: number; otherCdf: number }>();
  for (const t of tickets) {
    const row = byCashier.get(t.cashier) ?? { cashier: t.cashier, count: 0, cashCdf: 0, otherCdf: 0 };
    row.count += 1;
    if (t.isCash) row.cashCdf += t.totalCdf;
    else row.otherCdf += t.totalCdf;
    byCashier.set(t.cashier, row);
  }

  return {
    from: open.periodStart,
    to: open.periodEnd,
    expectedCdf,
    countedCdf,
    gapCdf,
    summary: {
      count: tickets.length,
      cashCount: expectation.salesCount,
      cashCdf: expectation.salesCashCdf,
      otherCount: expectation.otherCount,
      otherCdf: expectation.salesOtherCdf,
      expensesCdf: expectation.expensesCdf,
      openingFloatCdf: open.openingFloatCdf,
    },
    byCashier: [...byCashier.values()].sort((a, b) => b.cashCdf - a.cashCdf),
    duplicates,
    matching: { singles, pairs },
    otherPayments: tickets.filter((t) => !t.isCash),
    editedPrices,
    cancelled: cancelled.map(brief),
    expenses: expenses.map((e) => ({
      id: e.id,
      description: e.description,
      category: e.category.name,
      amountCdf: Math.round(n(e.amount)),
      date: e.date,
    })),
  };
}

export type OpenDayCheck = Awaited<ReturnType<typeof checkOpenDay>>;
