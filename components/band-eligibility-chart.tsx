"use client";

import { ProductTier } from "@prisma/client";
import { PACK_CONFIGS } from "@/lib/packs/config";
import { TIER_VALUE_BANDS, TIER_HIT_LABEL } from "@/lib/packs/bands";
import { TIER_ORDER } from "@/lib/packs/ev";
import { Check, CheckCircle } from "lucide-react";

const TIER_LABELS: Record<ProductTier, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  ULTRA_RARE: "Ultra Rare",
  SECRET_RARE: "Secret Rare",
  BANGER: "Banger",
  GRAIL: "Grail",
};

interface BandEligibilityChartProps {
  /** Product price in dollars (use null if user hasn't entered yet) */
  price: number | null;
  /** Optionally filter rows to only this tier — when set, other tiers are hidden */
  tier?: ProductTier | null;
}

function formatMoney(amount: number): string {
  if (amount >= 1000) return `$${Math.round(amount).toLocaleString()}`;
  if (amount >= 100) return `$${amount.toFixed(0)}`;
  return `$${amount.toFixed(2)}`;
}

export function BandEligibilityChart({
  price,
  tier,
}: BandEligibilityChartProps) {
  const visibleTiers = tier ? [tier] : TIER_ORDER;

  // Collect matches for summary line
  const matches: Array<{
    pack: string;
    packDisplay: string;
    tier: ProductTier;
    min: number;
    max: number;
  }> = [];

  if (price && price > 0) {
    for (const t of visibleTiers) {
      for (const pack of PACK_CONFIGS) {
        if (!pack.allowedTiers.includes(t)) continue;
        const band = TIER_VALUE_BANDS[t];
        const min = (pack.price / 100) * band.minMult;
        const max = (pack.price / 100) * band.maxMult;
        if (price >= min && price <= max) {
          matches.push({
            pack: pack.name,
            packDisplay: pack.displayPrice,
            tier: t,
            min,
            max,
          });
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      {price !== null && price > 0 && (
        <div
          className={`rounded-md border px-3 py-2.5 text-sm ${
            matches.length === 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {matches.length === 0 ? (
            <div>
              <span className="font-medium">⚠️ No eligible packs</span> for $
              {price.toFixed(2)}
              {tier ? ` at ${TIER_LABELS[tier]}` : ""}. This product would be{" "}
              <strong>unpickable</strong>.
            </div>
          ) : (
            <div>
              <span className="font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> ${price.toFixed(2)}{" "}
                fits {matches.length} pack
                {matches.length === 1 ? "" : "s"}:
              </span>
              <ul className="mt-1 space-y-0.5 font-mono text-xs text-emerald-300/80">
                {matches.map((m, i) => (
                  <li key={i}>
                    {m.packDisplay} {m.pack} · {TIER_LABELS[m.tier]} · band{" "}
                    {formatMoney(m.min)}–{formatMoney(m.max)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-1 text-xs"
        style={{
          gridTemplateColumns: `minmax(110px, 130px) repeat(${PACK_CONFIGS.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="px-2 py-2.5 text-[11px] font-medium text-zinc-400">
          Tier
        </div>
        {PACK_CONFIGS.map((pack) => (
          <div
            key={pack.id}
            className="rounded-md bg-zinc-900/60 px-2 py-2.5 text-center"
          >
            <div className="text-[12px] font-medium text-white">
              {pack.name}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 font-mono">
              {pack.displayPrice}
            </div>
          </div>
        ))}

        {/* Tier rows */}
        {visibleTiers.map((t) => {
          const band = TIER_VALUE_BANDS[t];
          return (
            <div key={t} className="contents">
              <div className="flex flex-col justify-center px-2 py-2 gap-0.5">
                <div className="text-[12px] font-medium text-zinc-200">
                  {TIER_LABELS[t]}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {TIER_HIT_LABEL[t]} · {Math.round(band.minMult * 100)}–
                  {Math.round(band.maxMult * 100)}%
                </div>
              </div>

              {PACK_CONFIGS.map((pack) => {
                const isAllowed = pack.allowedTiers.includes(t);

                if (!isAllowed) {
                  return (
                    <div
                      key={pack.id}
                      className="rounded-md py-2 px-1 text-center text-zinc-700 opacity-40"
                    >
                      —
                    </div>
                  );
                }

                const min = (pack.price / 100) * band.minMult;
                const max = (pack.price / 100) * band.maxMult;
                const inBand = price !== null && price >= min && price <= max;

                return (
                  <div
                    key={pack.id}
                    className={`rounded-md py-1.5 px-1 text-center font-mono text-[11px] border ${
                      inBand
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-400"
                    }`}
                  >
                    <div>{formatMoney(min)}</div>
                    <div>{formatMoney(max)}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
