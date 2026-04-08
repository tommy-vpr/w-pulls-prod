"use client";

export function ProductCardSkeleton() {
  return (
    <div>
      {/* Image — no outer case, matches ProductCard */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-800/30">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>

      {/* Content */}
      <div className="relative mt-2 px-1">
        <div className="mb-1">
          <div className="h-5 w-20 rounded-lg bg-zinc-900 skeleton-shimmer" />
        </div>
        <div className="h-4 w-3/4 rounded bg-zinc-900 skeleton-shimmer mb-2" />
        <div className="h-5 w-16 rounded bg-zinc-900 skeleton-shimmer" />
      </div>

      <style jsx>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
