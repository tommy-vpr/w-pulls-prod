import { ProductTier } from "@prisma/client";

export interface PackConfig {
  id: string;
  name: string;
  price: number; // cents
  displayPrice: string;
  description: string;
  minTier: ProductTier;
  allowedTiers: ProductTier[];
  odds: Record<ProductTier, number>;
}

/**
 * Zero-fill so every PackConfig.odds has every ProductTier key.
 * Lets us read `odds[tier]` safely without optional chaining.
 */
const ZERO_ODDS: Record<ProductTier, number> = {
  COMMON: 0,
  UNCOMMON: 0,
  RARE: 0,
  ULTRA_RARE: 0,
  SECRET_RARE: 0,
  BANGER: 0,
  GRAIL: 0,
};

/**
 * 5-pack ladder. Margins below assume band midpoints (honest worst case).
 * Real margin is higher when inventory clusters at the low end of each band,
 * which is the normal sourcing pattern.
 *
 *   Pocket    $25   →  ~28% margin (mid) / ~41% (low-end)
 *   Starter   $50   →  ~25% / ~39%
 *   Standard $100   →  ~20% / ~36%
 *   Premium  $200   →  ~17% / ~33%
 *   Whale    $500   →  ~12% / ~30%
 *
 * minTier is kept as "COMMON" because band-filtering scopes "what counts as
 * COMMON" to each pack's price tier — a $25 pack's COMMON is a $12.50–$18.75
 * card; a $500 pack's COMMON is a $250–$375 card.
 */
export const PACK_CONFIGS: PackConfig[] = [
  {
    id: "pocket",
    name: "Pocket Pull",
    price: 2500,
    displayPrice: "$25",
    description: "Quick rip. Mostly commons with a real shot at rare.",
    minTier: "COMMON",
    allowedTiers: ["COMMON", "UNCOMMON", "RARE"],
    odds: {
      ...ZERO_ODDS,
      COMMON: 68,
      UNCOMMON: 29,
      RARE: 3,
    },
  },
  {
    id: "starter",
    name: "Starter Pull",
    price: 5000,
    displayPrice: "$50",
    description: "Better odds at rare. Tiny chance of ultra rare.",
    minTier: "COMMON",
    allowedTiers: ["COMMON", "UNCOMMON", "RARE", "ULTRA_RARE"],
    odds: {
      ...ZERO_ODDS,
      COMMON: 66,
      UNCOMMON: 27,
      RARE: 6,
      ULTRA_RARE: 1,
    },
  },
  {
    id: "standard",
    name: "Standard Pull",
    price: 10000,
    displayPrice: "$100",
    description: "Real shot at ultra rare. Chase secret rares.",
    minTier: "COMMON",
    allowedTiers: ["COMMON", "UNCOMMON", "RARE", "ULTRA_RARE", "SECRET_RARE"],
    odds: {
      ...ZERO_ODDS,
      COMMON: 65,
      UNCOMMON: 25,
      RARE: 7,
      ULTRA_RARE: 2,
      SECRET_RARE: 1,
    },
  },
  {
    id: "premium",
    name: "Premium Pull",
    price: 20000,
    displayPrice: "$200",
    description: "Banger territory. 1 in 10,000 GRAIL.",
    minTier: "COMMON",
    allowedTiers: [
      "COMMON",
      "UNCOMMON",
      "RARE",
      "ULTRA_RARE",
      "SECRET_RARE",
      "BANGER",
      "GRAIL",
    ],
    odds: {
      ...ZERO_ODDS,
      COMMON: 65,
      UNCOMMON: 23,
      RARE: 8,
      ULTRA_RARE: 2.5,
      SECRET_RARE: 1,
      BANGER: 0.49,
      GRAIL: 0.01,
    },
  },
  {
    id: "whale",
    name: "Whale Pull",
    price: 50000,
    displayPrice: "$500",
    description: "Max stakes. Real grail odds. Up to $5,000 cards.",
    minTier: "COMMON",
    allowedTiers: [
      "COMMON",
      "UNCOMMON",
      "RARE",
      "ULTRA_RARE",
      "SECRET_RARE",
      "BANGER",
      "GRAIL",
    ],
    odds: {
      ...ZERO_ODDS,
      COMMON: 62,
      UNCOMMON: 22,
      RARE: 10,
      ULTRA_RARE: 4,
      SECRET_RARE: 1.5,
      BANGER: 0.45,
      GRAIL: 0.05,
    },
  },
];

export function getPackById(id: string): PackConfig | undefined {
  return PACK_CONFIGS.find((pack) => pack.id === id);
}
