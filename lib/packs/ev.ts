import { Product, ProductTier } from "@prisma/client";
import { isProductInBand, tierBandMidpoint } from "./bands";

/**
 * Tier ordering is a CONTRACT.
 * Never change order without a migration + audit.
 */
export const TIER_ORDER: ProductTier[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "ULTRA_RARE",
  "SECRET_RARE",
  "BANGER",
  "GRAIL",
];

export type TierOdds = Partial<Record<ProductTier, number>>;

function tierIndex(t: ProductTier) {
  return TIER_ORDER.indexOf(t);
}

/**
 * Enforces:
 * - minTier floor
 * - allowedTiers whitelist
 * - positive weights only
 */
function getEligibleEntries(params: {
  odds: TierOdds;
  minTier: ProductTier;
  allowedTiers: ProductTier[];
}) {
  const { odds, minTier, allowedTiers } = params;
  const minIdx = tierIndex(minTier);

  const entries = Object.entries(odds)
    .map(([tier, w]) => ({ tier: tier as ProductTier, weight: Number(w) }))
    .filter((e) => Number.isFinite(e.weight) && e.weight > 0)
    .filter(
      (e) => allowedTiers.includes(e.tier) && tierIndex(e.tier) >= minIdx,
    );

  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Invalid odds: no eligible tiers with weight > 0");
  }

  return { entries, totalWeight };
}

/**
 * Rolls a tier using weighted randomness.
 * Inventory is NOT checked here.
 */
export function rollTier(params: {
  odds: TierOdds;
  minTier: ProductTier;
  allowedTiers: ProductTier[];
}): ProductTier {
  const { entries, totalWeight } = getEligibleEntries(params);

  let roll = Math.random() * totalWeight;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.tier;
  }

  // Fallback (should never hit)
  return entries[entries.length - 1].tier;
}

/**
 * Inventory + BAND aware product selection.
 *
 * A product is eligible iff:
 *   1. product.tier === target tier
 *   2. product is active with inventory > 0
 *   3. product.price is inside the tier's value band for THIS pack price
 *
 * If the rolled tier has no eligible product, bump UPWARD ONLY and try
 * each higher tier's band in turn. The band gate is what prevents the
 * Legendary-pack disaster: even if a $5 BANGER-tagged product exists,
 * it's rejected in a $500 pack (band requires $2000+).
 */
export function pickProductWithBump(params: {
  products: Product[];
  rolledTier: ProductTier;
  packPriceCents: number;
}): Product | null {
  const { products, rolledTier, packPriceCents } = params;
  const startIdx = tierIndex(rolledTier);

  for (let i = startIdx; i < TIER_ORDER.length; i++) {
    const tier = TIER_ORDER[i];
    const pool = products.filter(
      (p) =>
        p.tier === tier &&
        p.isActive &&
        p.inventory > 0 &&
        isProductInBand(Number(p.price), tier, packPriceCents),
    );

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return null; // no inventory anywhere (system-level issue)
}

/**
 * Average value per tier — INVENTORY-WEIGHTED + band-filtered.
 *
 * Weighting by inventory matches the picker (uniform random over units, not
 * SKUs). Band-filtering ensures a wildly-mispriced product can't pollute the
 * average.
 *
 * If a tier has no band-eligible inventory we return the BAND MIDPOINT as
 * the EV estimate for that tier. This is what the EV would be if inventory
 * were restocked correctly — useful for forecasting and for the admin EV
 * panel when inventory is thin.
 */
function avgValueByTier(
  products: Product[],
  packPriceCents: number,
  valueFn: (p: Product) => number,
): Record<ProductTier, number> {
  const sums = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<
    ProductTier,
    number
  >;
  const counts = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<
    ProductTier,
    number
  >;

  for (const p of products) {
    if (!p.isActive || p.inventory <= 0) continue;
    if (!isProductInBand(Number(p.price), p.tier, packPriceCents)) continue;
    sums[p.tier] += valueFn(p) * p.inventory;
    counts[p.tier] += p.inventory;
  }

  return Object.fromEntries(
    TIER_ORDER.map((t) => [
      t,
      counts[t] ? sums[t] / counts[t] : tierBandMidpoint(t, packPriceCents),
    ]),
  ) as Record<ProductTier, number>;
}

/**
 * Expected Value (EV) — band-aware, inventory-weighted.
 * Respects minTier + allowedTiers.
 */
export function calculatePackEV(params: {
  odds: TierOdds;
  minTier: ProductTier;
  allowedTiers: ProductTier[];
  packPriceCents: number;
  products: Product[];
  valueFn?: (p: Product) => number;
}): number {
  const { odds, products, minTier, allowedTiers, packPriceCents } = params;
  const valueFn = params.valueFn ?? ((p) => Number(p.price));

  const avgs = avgValueByTier(products, packPriceCents, valueFn);
  const { entries, totalWeight } = getEligibleEntries({
    odds,
    minTier,
    allowedTiers,
  });

  return entries.reduce((ev, e) => {
    const prob = e.weight / totalWeight;
    return ev + prob * (avgs[e.tier] ?? 0);
  }, 0);
}

/**
 * Tier inventory stats (audit + admin UI).
 * NOT band-filtered — admin wants the full picture of what's in stock.
 */
export function getTierStats(products: Product[]) {
  const stats = Object.fromEntries(
    TIER_ORDER.map((t) => [
      t,
      {
        productCount: 0, // number of SKUs
        inventoryCount: 0, // total units
        totalValue: 0,
        avgPrice: 0,
      },
    ]),
  ) as Record<
    ProductTier,
    {
      productCount: number;
      inventoryCount: number;
      totalValue: number;
      avgPrice: number;
    }
  >;

  for (const p of products) {
    if (!p.isActive || p.inventory <= 0) continue;

    const price = Number(p.price);

    stats[p.tier].productCount += 1;
    stats[p.tier].inventoryCount += p.inventory;
    stats[p.tier].totalValue += price * p.inventory;
  }

  for (const tier of TIER_ORDER) {
    const { inventoryCount, totalValue } = stats[tier];
    stats[tier].avgPrice = inventoryCount > 0 ? totalValue / inventoryCount : 0;
  }

  return stats;
}

/**
 * Margin calculation (what finance cares about).
 */
export function calculatePackMargin(packPriceCents: number, ev: number) {
  const packPrice = packPriceCents / 100;
  const margin = packPrice - ev;
  const percentage = packPrice > 0 ? ((packPrice - ev) / packPrice) * 100 : 0;

  return { margin, percentage };
}

/**
 * Per-tier in-band inventory stats for a SPECIFIC pack.
 * Use this in the admin UI to see "for THIS pack, how much real inventory
 * does each tier have right now?"
 */
export function getInBandTierStats(
  products: Product[],
  packPriceCents: number,
) {
  const stats = Object.fromEntries(
    TIER_ORDER.map((t) => [
      t,
      { productCount: 0, inventoryCount: 0, avgPrice: 0, totalValue: 0 },
    ]),
  ) as Record<
    ProductTier,
    {
      productCount: number;
      inventoryCount: number;
      avgPrice: number;
      totalValue: number;
    }
  >;

  for (const p of products) {
    if (!p.isActive || p.inventory <= 0) continue;
    if (!isProductInBand(Number(p.price), p.tier, packPriceCents)) continue;
    const price = Number(p.price);
    stats[p.tier].productCount += 1;
    stats[p.tier].inventoryCount += p.inventory;
    stats[p.tier].totalValue += price * p.inventory;
  }

  for (const tier of TIER_ORDER) {
    const { inventoryCount, totalValue } = stats[tier];
    stats[tier].avgPrice = inventoryCount > 0 ? totalValue / inventoryCount : 0;
  }

  return stats;
}
