"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Clock } from "lucide-react";

interface BuybackItem {
  orderItemId: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  productValue: number;
  buybackRate: number;
  buybackAmount: number;
  deadline: string; // ISO — fixed at revealedAt + 10min
}

function useCountdown(deadlineIso: string, onExpire: () => void) {
  const [secs, setSecs] = useState(() =>
    Math.max(
      0,
      Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000),
    ),
  );
  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(deadlineIso).getTime() - Date.now()) / 1000),
      );
      setSecs(remaining);
      if (remaining <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadlineIso, onExpire]);
  return secs;
}

function Row({
  item,
  onDone,
}: {
  item: BuybackItem;
  onDone: (id: string) => void;
}) {
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const secs = useCountdown(item.deadline, () => onDone(item.orderItemId));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  const urgent = secs <= 60;

  const sell = async () => {
    if (selling) return;
    setSelling(true);
    setError(null);
    try {
      // 1. fresh quote
      const q = await fetch("/api/buyback/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: item.orderItemId }),
      });
      const qd = await q.json();
      if (!qd.success || !qd.quote)
        throw new Error(qd.error || "Could not get quote");

      // 2. accept
      const a = await fetch("/api/buyback/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: item.orderItemId,
          quoteToken: qd.quote.quoteToken,
        }),
      });
      const ad = await a.json();
      if (!a.ok) throw new Error(ad.error || "Buyback failed");

      onDone(item.orderItemId);
    } catch (e: any) {
      setError(e.message);
      setSelling(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <img
        src={item.imageUrl ?? "/images/placeholder-card.png"}
        alt={item.title}
        className="w-14 h-14 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-100 truncate">{item.title}</p>
        <div
          className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-mono ${
            urgent
              ? "bg-red-500/20 text-red-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          <Clock className="w-3 h-3" />
          {mins}:{rem.toString().padStart(2, "0")}
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={sell}
        disabled={selling || secs <= 0}
        className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        {selling
          ? "Selling..."
          : `Sell $${(item.buybackAmount / 100).toFixed(2)}`}
      </button>
    </div>
  );
}

export function BuybackList({ initialItems }: { initialItems: BuybackItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.orderItemId !== id));

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <Wallet className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400 font-medium">
          No cards available to sell back
        </p>
        <p className="text-sm text-zinc-600 mt-1">
          Sellback offers appear here for 10 minutes after revealing a pack.
        </p>
        <button
          onClick={() => router.push("/packs")}
          className="cursor-pointer mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
        >
          Open a pack →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <Row key={it.orderItemId} item={it} onDone={remove} />
      ))}
    </div>
  );
}
