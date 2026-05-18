import { ProductTier } from "@prisma/client";

/**
 * Value band per tier, expressed as a multiplier of pack price.
 *
 * A product is eligible to fill `tier` in a pack iff
 *   pack.price * minMult <= product.price <= pack.price * maxMult
 *
 * Bands are CLOSED on the low end, CLOSED on the high end — exact boundary
 * values are accepted on both sides. Be aware of overlap (e.g., a card priced
 * exactly at pack.price * 1.00 qualifies as both UNCOMMON and RARE); the
 * picker resolves this by looking only at the tier the roll selected.
 *
 * Mapping to GameStop-style hit tiers (display only — NOT a DB enum):
 *   COMMON      → H1   (50–75%)
 *   UNCOMMON    → H2   (75–100%)
 *   RARE        → H3   (100–175%)
 *   ULTRA_RARE  → H4a  (175–250%)
 *   SECRET_RARE → H4b  (250–400%)
 *   BANGER      → H5   (400–600%)
 *   GRAIL       → H6   (600–1000%)
 */
export const TIER_VALUE_BANDS: Record<
  ProductTier,
  { minMult: number; maxMult: number }
> = {
  COMMON: { minMult: 0.5, maxMult: 0.75 },
  UNCOMMON: { minMult: 0.75, maxMult: 1.0 },
  RARE: { minMult: 1.0, maxMult: 1.75 },
  ULTRA_RARE: { minMult: 1.75, maxMult: 2.5 },
  SECRET_RARE: { minMult: 2.5, maxMult: 4.0 },
  BANGER: { minMult: 4.0, maxMult: 6.0 },
  GRAIL: { minMult: 6.0, maxMult: 10.0 },
};

/**
 * Customer-facing label per tier. Used for display only; DB still stores
 * the ProductTier enum.
 */
export const TIER_HIT_LABEL: Record<ProductTier, string> = {
  COMMON: "H1",
  UNCOMMON: "H2",
  RARE: "H3",
  ULTRA_RARE: "H4",
  SECRET_RARE: "H5",
  BANGER: "H6",
  GRAIL: "H7",
};

/**
 * True iff `productPrice` (dollars) is inside the band for `tier` at this
 * pack price (cents).
 */
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

/**
 * Dollar bounds for a tier in this pack. Used for admin/EV/customer copy.
 */
export function tierBandDollars(
  tier: ProductTier,
  packPriceCents: number,
): { min: number; max: number } {
  const packPrice = packPriceCents / 100;
  const { minMult, maxMult } = TIER_VALUE_BANDS[tier];
  return { min: packPrice * minMult, max: packPrice * maxMult };
}

/**
 * Midpoint dollar value — used as the "honest published EV" estimate when
 * actual inventory is unknown or empty for a tier.
 */
export function tierBandMidpoint(
  tier: ProductTier,
  packPriceCents: number,
): number {
  const { min, max } = tierBandDollars(tier, packPriceCents);
  return (min + max) / 2;
}
