export const dynamic = "force-dynamic";

export const metadata = {
  title: "Changelog | W-Pulls",
  description: "Latest updates and improvements to W-Pulls",
};

const CHANGELOG = [
  {
    version: "1.2.0",
    date: "April 2026",
    tag: "Feature",
    tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    changes: [
      "Added buyback system — sell cards back instantly after reveal",
      "Wallet system with hold period and withdrawal support",
      "Stripe Connect integration for payouts",
      "Pack reveal animation with holographic card effects",
      "Mobile-responsive design across all pages",
    ],
  },
  {
    version: "1.1.0",
    date: "March 2026",
    tag: "Improvement",
    tagColor: "text-violet-400 bg-violet-400/10 border-violet-400/30",
    changes: [
      "Improved pack selection UI with tier breakdown charts",
      "3D carousel on homepage showing featured cards",
      "Google OAuth sign-in support",
      "Email verification for new accounts",
      "Order history with detailed order view",
    ],
  },
  {
    version: "1.0.0",
    date: "February 2026",
    tag: "Launch",
    tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    changes: [
      "Initial launch of W-Pulls card system",
      "Four pack tiers: Common, Rare, Ultra Rare, Secret Rare",
      "Stripe payment integration",
      "User dashboard with order tracking",
      "Admin panel for product and order management",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#030812] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1
            className="font-orbitron text-3xl md:text-4xl font-bold text-cyan-400 mb-3"
            style={{ textShadow: "0 0 20px rgba(0,255,255,0.4)" }}
          >
            Changelog
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Latest updates, improvements, and new features.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/30 to-transparent ml-3" />

          <div className="space-y-10 pl-10">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="relative">
                {/* Dot */}
                <div className="absolute -left-10 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.6)]" />

                <div className="flex items-center gap-3 mb-4">
                  <span className="font-orbitron text-white font-bold text-lg">
                    v{entry.version}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full border ${entry.tagColor}`}
                  >
                    {entry.tag}
                  </span>
                  <span className="text-zinc-600 text-xs font-mono ml-auto">
                    {entry.date}
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <ul className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-400"
                      >
                        <span className="text-cyan-500 mt-0.5 shrink-0">→</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
