export type CategoryAmounts = {
  usd: number;
  cdf: number;
};

export type SaleCategoryBreakdown = {
  beverage: CategoryAmounts;
  food: CategoryAmounts;
  other: CategoryAmounts;
};

type SaleItemLike = {
  quantity: unknown;
  totalPrice: unknown;
  unitPriceCdf: unknown;
  product?: { type?: string | null } | null;
};

function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function computeSaleCategoryBreakdown(items: SaleItemLike[]): SaleCategoryBreakdown {
  const breakdown: SaleCategoryBreakdown = {
    beverage: { usd: 0, cdf: 0 },
    food: { usd: 0, cdf: 0 },
    other: { usd: 0, cdf: 0 },
  };

  for (const item of items) {
    const usd = toNum(item.totalPrice);
    const cdf = Math.round(toNum(item.unitPriceCdf)) * toNum(item.quantity);
    const type = item.product?.type;

    if (type === "BEVERAGE") {
      breakdown.beverage.usd += usd;
      breakdown.beverage.cdf += cdf;
    } else if (type === "FOOD") {
      breakdown.food.usd += usd;
      breakdown.food.cdf += cdf;
    } else {
      breakdown.other.usd += usd;
      breakdown.other.cdf += cdf;
    }
  }

  return breakdown;
}

export function mergeCategoryBreakdowns(
  target: SaleCategoryBreakdown,
  source: SaleCategoryBreakdown
): SaleCategoryBreakdown {
  return {
    beverage: {
      usd: target.beverage.usd + source.beverage.usd,
      cdf: target.beverage.cdf + source.beverage.cdf,
    },
    food: {
      usd: target.food.usd + source.food.usd,
      cdf: target.food.cdf + source.food.cdf,
    },
    other: {
      usd: target.other.usd + source.other.usd,
      cdf: target.other.cdf + source.other.cdf,
    },
  };
}

export function emptyCategoryBreakdown(): SaleCategoryBreakdown {
  return {
    beverage: { usd: 0, cdf: 0 },
    food: { usd: 0, cdf: 0 },
    other: { usd: 0, cdf: 0 },
  };
}
