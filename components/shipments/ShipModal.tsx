"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Truck, Loader2, Package } from "lucide-react";
import { SHIPPING_RATES, type ShippingMethod } from "@/lib/shipments/config";

export interface ShipItem {
  orderItemId: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  tier: string;
}

export interface DefaultAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal: string;
  country: string;
}

interface ShipModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShipItem[];
  defaultAddress?: DefaultAddress;
}

export function ShipModal({
  isOpen,
  onClose,
  items,
  defaultAddress,
}: ShipModalProps) {
  const router = useRouter();
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("STANDARD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({
    name: defaultAddress?.name ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    postal: defaultAddress?.postal ?? "",
    country: defaultAddress?.country ?? "US",
  });

  if (!isOpen) return null;

  const selectedRate = SHIPPING_RATES[shippingMethod];

  const handleSubmit = async () => {
    setError(null);

    if (
      !address.name ||
      !address.line1 ||
      !address.city ||
      !address.state ||
      !address.postal
    ) {
      setError("Please fill in all required address fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create ShipmentRequest
      const createRes = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ orderItemId: i.orderItemId })),
          shippingName: address.name,
          shippingLine1: address.line1,
          shippingLine2: address.line2 || null,
          shippingCity: address.city,
          shippingState: address.state,
          shippingPostal: address.postal,
          shippingCountry: address.country,
          shippingMethod,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.error ?? "Failed to create shipment request.");
        return;
      }

      // 2. Create checkout (or skip Stripe for free)
      const checkoutRes = await fetch("/api/shipments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentRequestId: createData.shipmentRequestId,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        setError(checkoutData.error ?? "Failed to create checkout.");
        return;
      }

      // Free shipping — redirect to shipments dashboard
      if (checkoutData.free) {
        router.push(checkoutData.redirectUrl);
        onClose();
        return;
      }

      // Paid — redirect to Stripe
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,20,28,.98), rgba(6,12,18,.98))",
          border: "1px solid rgba(0,255,255,.2)",
          boxShadow: "0 0 40px rgba(0,255,255,.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/20">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono font-semibold text-white text-sm uppercase tracking-wider">
              Ship to Me
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-mono mb-3">
              {items.length === 1
                ? "Card Being Shipped"
                : `${items.length} Cards Being Shipped`}
            </p>
            <div className="flex gap-2 flex-wrap">
              {items.map((item) => (
                <div
                  key={item.orderItemId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(0,255,255,.05)",
                    border: "1px solid rgba(0,255,255,.15)",
                  }}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={28}
                      height={28}
                      className="rounded object-cover w-7 h-7"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-cyan-400/40" />
                  )}
                  <span className="text-xs text-zinc-300 font-mono max-w-[140px] truncate">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-mono mb-3">
              Shipping Address
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Full Name *"
                value={address.name}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, name: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
              />
              <input
                type="text"
                placeholder="Address Line 1 *"
                value={address.line1}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, line1: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
              />
              <input
                type="text"
                placeholder="Address Line 2 (optional)"
                value={address.line2}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, line2: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City *"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, city: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={address.state}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, state: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ZIP Code *"
                  value={address.postal}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, postal: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
                />
                <select
                  value={address.country}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, country: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
                >
                  <option value="US">United States</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipping method */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-mono mb-3">
              Shipping Method
            </p>
            <div className="space-y-2">
              {(
                Object.entries(SHIPPING_RATES) as [
                  ShippingMethod,
                  (typeof SHIPPING_RATES)[ShippingMethod],
                ][]
              ).map(([method, rate]) => (
                <button
                  key={method}
                  onClick={() => setShippingMethod(method)}
                  className="cursor-pointer w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all"
                  style={{
                    background:
                      shippingMethod === method
                        ? "rgba(0,255,255,.08)"
                        : "rgba(0,0,0,.3)",
                    border:
                      shippingMethod === method
                        ? "1px solid rgba(0,255,255,.4)"
                        : "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor:
                          shippingMethod === method
                            ? "rgba(0,255,255,.8)"
                            : "rgba(255,255,255,.2)",
                      }}
                    >
                      {shippingMethod === method && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <span className="text-sm text-zinc-300 font-mono">
                      {rate.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{
                      color: rate.amount === 0 ? "#4ade80" : "#00ffff",
                      textShadow:
                        rate.amount === 0
                          ? "0 0 6px rgba(74,222,128,.4)"
                          : "0 0 6px rgba(0,255,255,.4)",
                    }}
                  >
                    {rate.display}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cursor-pointer w-full py-3 rounded-lg font-mono font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isSubmitting
                ? "rgba(0,255,255,.1)"
                : "linear-gradient(135deg, rgba(0,255,255,.15), rgba(0,255,255,.05))",
              border: "1px solid rgba(0,255,255,.4)",
              color: "#00ffff",
              boxShadow: isSubmitting ? "none" : "0 0 20px rgba(0,255,255,.1)",
              textShadow: "0 0 6px rgba(0,255,255,.4)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : selectedRate.amount === 0 ? (
              <>
                <Truck className="w-4 h-4" />
                Confirm Free Shipping
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Pay {selectedRate.display} & Ship
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
