// app/(user)/dashboard/shipments/loading.tsx

export default function ShipmentsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-zinc-800/60 rounded animate-pulse" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 w-24 bg-zinc-800 rounded-md animate-pulse" />
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 animate-pulse" />
                <div className="w-10 h-10 rounded-lg bg-zinc-800 animate-pulse" />
              </div>
              <div className="h-3 w-40 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 w-28 bg-zinc-800/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
