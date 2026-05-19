import { ProductTier } from "@prisma/client";

/**
 * Value bands — V3 flat-odds psychology with capped GRAIL exposure.
 *
 * Every pack uses the same probability distribution (V3 style), but the
 * GRAIL band is capped at 7–10× pack price — NOT V3's runaway 10–50×.
 *
 * Headline: "Every pack can hit up to 10× your money."
 *
 * Tier mapping:
 *   COMMON      → H1   (50–75%)
 *   UNCOMMON    → H2   (75–100%)
 *   RARE        → H3   (100–200%)
 *   ULTRA_RARE  → H4   (200–400%)
 *   SECRET_RARE → unused in V3 (kept in enum for backward compat)
 *   BANGER      → H5   (400–700%)
 *   GRAIL       → H6   (700–1000%) ← capped at 10× pack price
 *
 * Expected margins (with flat 40.5/30.5/25.3/3/0.6/0.1 odds):
 *   • Low-end sourcing:   ~22.5% margin
 *   • Realistic (seed):   ~12% margin
 *   • Midpoint sourcing:  −3% margin  (avoid!)
 *
 * Lesson: source aggressively near band minimums. RARE is the swing — at
 * 25.3% probability with a 1–2× band, every 10% RARE price slip costs 2.5%
 * of pack revenue.
 */
export const TIER_VALUE_BANDS: Record<
  ProductTier,
  { minMult: number; maxMult: number }
> = {
  COMMON: { minMult: 0.5, maxMult: 0.75 }, // H1
  UNCOMMON: { minMult: 0.75, maxMult: 1.0 }, // H2
  RARE: { minMult: 1.0, maxMult: 2.0 }, // H3
  ULTRA_RARE: { minMult: 2.0, maxMult: 4.0 }, // H4
  SECRET_RARE: { minMult: 2.0, maxMult: 4.0 }, // unused — mirrors UR
  BANGER: { minMult: 4.0, maxMult: 7.0 }, // H5
  GRAIL: { minMult: 7.0, maxMult: 10.0 }, // H6 — capped at 10×
};

export const TIER_HIT_LABEL: Record<ProductTier, string> = {
  COMMON: "H1",
  UNCOMMON: "H2",
  RARE: "H3",
  ULTRA_RARE: "H4",
  SECRET_RARE: "H4",
  BANGER: "H5",
  GRAIL: "H6",
};

export function isProductInBand(
  productPrice: number,
  tier: ProductTier,
  packPriceCents: number,
): boolean {
  const packPrice = packPriceCents / 100;
  const { minMult, maxMult } = TIER_VALUE_BANDS[tier];
  return (
    productPrice >= packPrice * minMult && productPrice <= packPrice * maxMult
  );
}

export function tierBandDollars(
  tier: ProductTier,
  packPriceCents: number,
): { min: number; max: number } {
  const packPrice = packPriceCents / 100;
  const { minMult, maxMult } = TIER_VALUE_BANDS[tier];
  return { min: packPrice * minMult, max: packPrice * maxMult };
}

export function tierBandMidpoint(
  tier: ProductTier,
  packPriceCents: number,
): number {
  const { min, max } = tierBandDollars(tier, packPriceCents);
  return (min + max) / 2;
}
