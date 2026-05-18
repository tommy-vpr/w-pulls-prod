// components/admin/product-band-eligibility.tsx
"use client";

import { ProductTier } from "@prisma/client";
import { PACK_CONFIGS } from "@/lib/packs/config";
import { isProductInBand, tierBandDollars } from "@/lib/packs/bands";
import { Check } from "lucide-react";

interface Props {
  tier: ProductTier | null;
  price: number | null; // dollars
}

export function ProductBandEligibility({ tier, price }: Props) {
  if (!tier || !price || price <= 0) return null;

  const eligiblePacks = PACK_CONFIGS.filter(
    (pack) =>
      pack.allowedTiers.includes(tier) &&
      isProductInBand(price, tier, pack.price),
  );

  if (eligiblePacks.length === 0) {
    // Show all packs that COULD use this tier and what their band needs
    const couldUse = PACK_CONFIGS.filter((p) => p.allowedTiers.includes(tier));

    return (
      <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
        <div className="font-medium text-amber-400">
          ⚠️ Not eligible for any pack. Won't be selectable in pulls.
        </div>
        <ul className="mt-2 space-y-0.5 text-amber-300/70">
          {couldUse.map((pack) => {
            const band = tierBandDollars(tier, pack.price);
            return (
              <li key={pack.id}>
                {pack.displayPrice} {pack.name} {tier}: ${band.min.toFixed(2)}–$
                {band.max.toFixed(2)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs">
      <div className="font-medium text-emerald-400">
        <Check /> Eligible for {eligiblePacks.length} pack
        {eligiblePacks.length > 1 ? "s" : ""}:
      </div>
      <ul className="mt-1 text-emerald-300/80">
        {eligiblePacks.map((pack) => {
          const band = tierBandDollars(tier, pack.price);
          return (
            <li key={pack.id}>
              {pack.displayPrice} {pack.name} (band ${band.min.toFixed(2)}–$
              {band.max.toFixed(2)})
            </li>
          );
        })}
      </ul>
    </div>
  );
}
