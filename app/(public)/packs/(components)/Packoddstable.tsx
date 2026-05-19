"use client";

import { ProductTier } from "@prisma/client";
import { PackConfig, PACK_CONFIGS } from "@/lib/packs/config";
import { TIER_ORDER } from "@/lib/packs/ev";
import {
  TIER_HIT_LABEL,
  TIER_VALUE_BANDS,
  tierBandDollars,
} from "@/lib/packs/bands";

const TIER_COLORS: Record<
  ProductTier,
  { bar: string; text: string; glow: string }
> = {
  COMMON: {
    bar: "bg-slate-400",
    text: "text-slate-300",
    glow: "shadow-slate-400/30",
  },
  UNCOMMON: {
    bar: "bg-emerald-400",
    text: "text-emerald-400",
    glow: "shadow-emerald-400/30",
  },
  RARE: {
    bar: "bg-blue-400",
    text: "text-blue-400",
    glow: "shadow-blue-400/30",
  },
  ULTRA_RARE: {
    bar: "bg-purple-400",
    text: "text-purple-400",
    glow: "shadow-purple-400/30",
  },
  SECRET_RARE: {
    bar: "bg-amber-400",
    text: "text-amber-400",
    glow: "shadow-amber-400/30",
  },
  BANGER: {
    bar: "bg-rose-400",
    text: "text-rose-400",
    glow: "shadow-rose-400/30",
  },
  GRAIL: {
    bar: "bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400",
    text: "text-fuchsia-300",
    glow: "shadow-fuchsia-400/50",
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

function formatMoney(amount: number): string {
  if (amount >= 1000) {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatProbability(percentage: number): string {
  if (percentage >= 1) return `${percentage.toFixed(0)}%`;
  return `1 in ${Math.round(100 / percentage).toLocaleString("en-US")}`;
}

interface PackOddsTableProps {
  packs?: PackConfig[];
}

export function PackOddsTable({ packs = PACK_CONFIGS }: PackOddsTableProps) {
  // Only show tiers that any pack actually uses
  const visibleTiers = TIER_ORDER.filter((tier) =>
    packs.some((p) => p.odds[tier] > 0),
  );

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <h2 className="text-sm font-medium uppercase tracking-widest text-cyan-400">
          Pull Rates
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      {/* Horizontally scrollable on small screens */}
      <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-x-auto">
        <div
          className="grid min-w-[760px] text-sm"
          style={{
            gridTemplateColumns: `minmax(160px, 220px) repeat(${packs.length}, minmax(110px, 1fr))`,
          }}
        >
          {/* ─── Header row ─── */}
          <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/60">
            <span className="text-xs uppercase tracking-wider text-slate-500">
              Tier
            </span>
          </div>
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="px-3 py-3 border-b border-l border-slate-700/50 bg-slate-800/60"
            >
              <div className="text-white font-semibold leading-tight">
                {pack.name}
              </div>
              <div className="text-cyan-400 font-mono text-xs mt-0.5">
                {pack.displayPrice}
              </div>
            </div>
          ))}

          {/* ─── Tier rows ─── */}
          {visibleTiers.map((tier, rowIdx) => {
            const colors = TIER_COLORS[tier];
            const band = TIER_VALUE_BANDS[tier];
            const rowBg =
              rowIdx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/0";

            return (
              <div key={tier} className="contents">
                {/* Tier label cell */}
                <div
                  className={`flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/30 ${rowBg}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${colors.bar} shadow-lg ${colors.glow} shrink-0`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`${colors.text} font-medium truncate`}>
                        {TIER_LABELS[tier]}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {TIER_HIT_LABEL[tier]}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {(band.minMult * 100).toFixed(0)}–
                      {(band.maxMult * 100).toFixed(0)}% of pack
                    </div>
                  </div>
                </div>

                {/* One cell per pack */}
                {packs.map((pack) => {
                  const weight = pack.odds[tier] ?? 0;
                  if (weight <= 0) {
                    return (
                      <div
                        key={pack.id}
                        className={`px-3 py-3 border-b border-l border-slate-700/30 text-slate-700 text-center ${rowBg}`}
                      >
                        —
                      </div>
                    );
                  }
                  const totalWeight = TIER_ORDER.reduce(
                    (s, t) => s + (pack.odds[t] ?? 0),
                    0,
                  );
                  const pct = (weight / totalWeight) * 100;
                  const dollars = tierBandDollars(tier, pack.price);

                  return (
                    <div
                      key={pack.id}
                      className={`px-3 py-3 border-b border-l border-slate-700/30 ${rowBg}`}
                    >
                      <div className="font-mono text-white tabular-nums leading-tight">
                        {formatProbability(pct)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatMoney(dollars.min)}–{formatMoney(dollars.max)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ─── Footer row: top prize per pack ─── */}
          <div className="px-4 py-2.5 bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500">
            Top prize
          </div>
          {packs.map((pack) => {
            const activeTiers = TIER_ORDER.filter((t) => pack.odds[t] > 0);
            const topTier = activeTiers[activeTiers.length - 1];
            const topBand = tierBandDollars(topTier, pack.price);
            return (
              <div
                key={pack.id}
                className="px-3 py-2.5 border-l border-slate-700/30 bg-slate-800/40"
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`${TIER_COLORS[topTier].text} font-mono text-sm font-semibold`}
                  >
                    {formatMoney(topBand.max)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {TIER_LABELS[topTier]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
