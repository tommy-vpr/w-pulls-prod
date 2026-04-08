import { CardSkeleton } from "@/components/ui/loadings";

export default function CollectionsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-64 bg-zinc-700 rounded animate-pulse" />
      </div>

      {/* Stats — matches md:grid-cols-4 */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse"
          >
            <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
            <div className="h-6 w-20 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>

      {/* Grid — matches sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 animate-pulse">
            {/* Card image */}
            <div className="relative aspect-[3/4] w-full rounded-lg bg-zinc-800" />
            {/* Info below */}
            <div className="px-1 space-y-1.5">
              <div className="h-4 w-16 bg-zinc-800 rounded" />
              <div className="h-4 w-3/4 bg-zinc-700 rounded" />
              <div className="h-4 w-12 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
