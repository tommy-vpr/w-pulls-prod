"use client";

import { ProductTier } from "@prisma/client";
import { PackConfig, PACK_CONFIGS } from "@/lib/packs/config";
import { TIER_ORDER } from "@/lib/packs/ev";
import { TIER_HIT_LABEL, tierBandDollars } from "@/lib/packs/bands";

const TIER_COLORS: Record<
  ProductTier,
  { bg: string; bar: string; glow: string; text: string }
> = {
  COMMON: {
    bg: "bg-slate-500/20",
    bar: "bg-slate-400",
    glow: "shadow-slate-400/30",
    text: "text-slate-300",
  },
  UNCOMMON: {
    bg: "bg-emerald-500/20",
    bar: "bg-emerald-400",
    glow: "shadow-emerald-400/30",
    text: "text-emerald-400",
  },
  RARE: {
    bg: "bg-blue-500/20",
    bar: "bg-blue-400",
    glow: "shadow-blue-400/30",
    text: "text-blue-400",
  },
  ULTRA_RARE: {
    bg: "bg-purple-500/20",
    bar: "bg-purple-400",
    glow: "shadow-purple-400/30",
    text: "text-purple-400",
  },
  SECRET_RARE: {
    bg: "bg-amber-500/20",
    bar: "bg-amber-400",
    glow: "shadow-amber-400/30",
    text: "text-amber-400",
  },
  BANGER: {
    bg: "bg-rose-500/20",
    bar: "bg-rose-400",
    glow: "shadow-rose-400/30",
    text: "text-rose-400",
  },
  GRAIL: {
    bg: "bg-fuchsia-500/20",
    bar: "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400",
    glow: "shadow-fuchsia-400/50",
    text: "text-fuchsia-300",
  },
};

const TIER_LABELS: Record<ProductTier, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  ULTRA_RARE: "Ultra Rare",
  SECRET_RARE: "Secret Rare",
  BANGER: "Banger",
  GRAIL: "Grail",
};

/**
 * Money formatter — uses thousand separators, no cents above $1k for readability.
 */
function formatMoney(amount: number): string {
  if (amount >= 1000) {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (amount >= 100) {
    return `$${amount.toFixed(0)}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format probability: large = "65%", small = "1 in 200" / "1 in 10,000"
 * Lottery-style copy for rare odds reads better than "0.05%".
 */
function formatProbability(percentage: number): string {
  if (percentage >= 1) {
    return `${percentage.toFixed(0)}%`;
  }
  if (percentage >= 0.1) {
    return `${percentage.toFixed(1)}%`;
  }
  // sub-0.1% → "1 in N"
  const oneIn = Math.round(100 / percentage);
  return `1 in ${oneIn.toLocaleString("en-US")}`;
}

interface PackOddsCardProps {
  pack: PackConfig;
}

function PackOddsCard({ pack }: PackOddsCardProps) {
  const activeTiers = TIER_ORDER.filter((tier) => pack.odds[tier] > 0);
  const totalWeight = activeTiers.reduce(
    (sum, tier) => sum + pack.odds[tier],
    0,
  );

  // Footer values: band floor of lowest active tier, band ceiling of highest
  const lowestTier = activeTiers[0];
  const highestTier = activeTiers[activeTiers.length - 1];
  const floorBand = tierBandDollars(lowestTier, pack.price);
  const topBand = tierBandDollars(highestTier, pack.price);

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-cyan-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

      <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{pack.name}</h3>
            <span className="text-cyan-400 font-mono text-sm">
              {pack.displayPrice}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{pack.description}</p>
        </div>

        {/* Tier breakdown */}
        <div className="p-4 space-y-3">
          {activeTiers.map((tier) => {
            const percentage = (pack.odds[tier] / totalWeight) * 100;
            const colors = TIER_COLORS[tier];
            const band = tierBandDollars(tier, pack.price);

            return (
              <div key={tier} className="space-y-1.5">
                {/* Label row */}
                <div className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full ${colors.bar} shadow-lg ${colors.glow} shrink-0`}
                    />
                    <span className={`${colors.text} truncate`}>
                      {TIER_LABELS[tier]}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {TIER_HIT_LABEL[tier]}
                    </span>
                  </div>
                  <span className="font-mono text-white/90 tabular-nums shrink-0 text-xs">
                    {formatProbability(percentage)}
                  </span>
                </div>

                {/* Dollar band */}
                <div className="text-[11px] text-slate-400 font-mono pl-4">
                  {formatMoney(band.min)} – {formatMoney(band.max)}
                </div>

                {/* Progress bar */}
                <div
                  className={`h-2 rounded-full ${colors.bg} overflow-hidden`}
                >
                  <div
                    className={`h-full rounded-full ${colors.bar} shadow-lg ${colors.glow} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — floor + top prize */}
        <div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Floor:</span>
              <span className="text-slate-300 font-mono">
                {formatMoney(floorBand.min)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Top prize:</span>
              <span className={`${TIER_COLORS[highestTier].text} font-mono`}>
                {formatMoney(topBand.max)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PackOddsBreakdownProps {
  packs?: PackConfig[];
  columns?: 1 | 2 | 3 | 4 | 5;
}

export function PackOddsBreakdown({
  packs = PACK_CONFIGS,
  columns = 3,
}: PackOddsBreakdownProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <h2 className="text-sm font-medium uppercase tracking-widest text-cyan-400">
          Pull Rates
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {packs.map((pack) => (
          <PackOddsCard key={pack.id} pack={pack} />
        ))}
      </div>
    </div>
  );
}

export { PackOddsCard };
