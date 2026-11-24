export type SpacePrice = { priceCdf: unknown; priceUsd: unknown; space: { name: string } };

/** Label when the price charged matches none of the product's prices. */
export const OTHER_PRICE = "Autre prix";

/**
 * The sale line does not store the space (Terrasse / VIP): it is found back from the price
 * charged, compared with the product's prices per space. "Terrasse / VIP" when both cost
 * the same; OTHER_PRICE when the price no longer matches (changed since, or edited).
 */
export function spaceOf(prices: SpacePrice[], unitCdf: number, unitUsd: number): string {
  const byCdf = prices.filter((p) => unitCdf > 0 && Math.round(Number(p.priceCdf)) === Math.round(unitCdf));
  const byUsd = prices.filter((p) => unitUsd > 0 && Math.abs(Number(p.priceUsd) - unitUsd) < 0.005);
  const matches = byCdf.length > 0 ? byCdf : byUsd;
  const names = [...new Set(matches.map((p) => p.space.name))];
  return names.length === 0 ? OTHER_PRICE : names.join(" / ");
}
