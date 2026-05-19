import { ProductTier } from "@prisma/client";

export interface PackConfig {
  id: string;
  name: string;
  price: number; // cents
  displayPrice: string;
  description: string;
  minTier: ProductTier;
  allowedTiers: ProductTier[];
  /** Probabilities sum to 100. SECRET_RARE stays at 0 — unused in V3. */
  odds: Record<ProductTier, number>;
}

/**
 * V3 flat odds — identical distribution across every pack.
 *
 * Tier → V3 outcome mapping:
 *   COMMON      → H1  (50–75%)
 *   UNCOMMON    → H2  (75–100%)
 *   RARE        → H3  (100–200%)
 *   ULTRA_RARE  → H4  (200–400%)
 *   SECRET_RARE → unused, kept in enum for backward compat
 *   BANGER      → H5  (400–800%)
 *   GRAIL       → H6  (1000–5000%, i.e. 10×–50× pack price)
 *
 * V3 doc: H1=40.5%, H2=30.5%, H3=25.3%, H4=3.0%, H5=0.6%, H6=0.1%
 */
const V3_FLAT_ODDS: Record<ProductTier, number> = {
  COMMON: 40.5,
  UNCOMMON: 30.5,
  RARE: 25.3,
  ULTRA_RARE: 3.0,
  SECRET_RARE: 0.0,
  BANGER: 0.6,
  GRAIL: 0.1,
};

/** Every pack allows every active V3 tier (SECRET_RARE excluded). */
const V3_TIERS: ProductTier[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "ULTRA_RARE",
  "BANGER",
  "GRAIL",
];

/**
 * V3 5-pack ladder. Names follow V3 spec (Silver → Black Label).
 * Pack IDs match V3 names — clean break from old W-Pulls naming.
 *
 * Historical orders keep their original Order.packId / packName values
 * via Order denormalization, so no data migration needed for closed orders.
 */
export const PACK_CONFIGS: PackConfig[] = [
  {
    id: "silver",
    name: "Silver Pull",
    price: 2500,
    displayPrice: "$25",
    description:
      "Entry tier. Every pack has the same lottery shape — even a Silver can hit GRAIL.",
    minTier: "COMMON",
    allowedTiers: V3_TIERS,
    odds: V3_FLAT_ODDS,
  },
  {
    id: "gold",
    name: "Gold Pull",
    price: 5000,
    displayPrice: "$50",
    description: "Step up. Same odds as Silver, double the prize ceiling.",
    minTier: "COMMON",
    allowedTiers: V3_TIERS,
    odds: V3_FLAT_ODDS,
  },
  {
    id: "platinum",
    name: "Platinum Pull",
    price: 10000,
    displayPrice: "$100",
    description:
      "Mid-luxury. GRAIL territory: $1,000–$5,000 cards on the 1-in-1000.",
    minTier: "COMMON",
    allowedTiers: V3_TIERS,
    odds: V3_FLAT_ODDS,
  },
  {
    id: "diamond",
    name: "Diamond Pull",
    price: 25000,
    displayPrice: "$250",
    description: "Premium. Banger range $1,000–$2,000. GRAIL up to $12,500.",
    minTier: "COMMON",
    allowedTiers: V3_TIERS,
    odds: V3_FLAT_ODDS,
  },
  {
    id: "black-label",
    name: "Black Label Pull",
    price: 50000,
    displayPrice: "$500",
    description: "Maximum tier. Top prize: $25,000 GRAIL. Source the chase.",
    minTier: "COMMON",
    allowedTiers: V3_TIERS,
    odds: V3_FLAT_ODDS,
  },
];

export const PACKS_BY_ID = Object.fromEntries(
  PACK_CONFIGS.map((p) => [p.id, p]),
);

export function packById(id: string): PackConfig | null {
  return PACKS_BY_ID[id] ?? null;
}
