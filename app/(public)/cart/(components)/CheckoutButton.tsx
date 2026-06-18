"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart/cart.store";
import { Loader2 } from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function CheckoutButton() {
  const items = useCartStore((s) => s.items);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function checkout() {
    if (isLoading || items.length === 0) return;
    if (!turnstileToken) return; // gated by verification

    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, turnstileToken }),
      });
      const data = await res.json();

      if (res.status === 403 && /verif/i.test(data.error ?? "")) {
        setTurnstileToken(null);
        setResetKey((k) => k + 1);
        setIsLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout failed:", data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={checkout}
        disabled={isLoading || items.length === 0 || !turnstileToken}
        className="font-mono uppercase w-full border border-green-300/30 bg-green-600/30 rounded text-green-400 
          hover:text-white hover:bg-green-500 transition duration-300 py-3 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600/30 disabled:hover:text-green-400
          flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
          </>
        ) : !turnstileToken ? (
          "Verify to checkout"
        ) : (
          "Checkout"
        )}
      </button>
      {!turnstileToken && (
        <div className="flex justify-center">
          <TurnstileWidget
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            resetKey={resetKey}
            theme="dark"
            appearance="interaction-only"
          />
        </div>
      )}
    </div>
  );
}
