// app/(user)/dashboard/shipments/page.tsx
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Truck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Shipments",
};

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; color: string; border: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    color: "text-zinc-400",
    border: "border-zinc-700",
    icon: Clock,
  },
  PAID: {
    label: "Paid",
    color: "text-yellow-400",
    border: "border-yellow-500/40",
    icon: Clock,
  },
  SENT_TO_WMS: {
    label: "Processing",
    color: "text-cyan-400",
    border: "border-cyan-500/40",
    icon: Loader2,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-400",
    border: "border-blue-500/40",
    icon: Package,
  },
  SHIPPED: {
    label: "Shipped",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-400",
    border: "border-red-500/40",
    icon: AlertCircle,
  },
};

const CARRIER_URLS: Record<string, (tracking: string) => string> = {
  ups: (t) => `https://www.ups.com/track?tracknum=${t}`,
  fedex: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
  stamps_com: (t) =>
    `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
  usps: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
};

function getTrackingUrl(
  carrier: string,
  trackingNumber: string,
  trackingUrl?: string | null,
) {
  if (trackingUrl) return trackingUrl;
  const builder = CARRIER_URLS[carrier.toLowerCase()];
  return builder ? builder(trackingNumber) : null;
}

export default async function ShipmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const shipments = await prisma.shipmentRequest.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { title: true, imageUrl: true, tier: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-mono">Shipments</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Track your physical card shipments
        </p>
      </div>

      {shipments.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-mono">No shipments yet.</p>
          <p className="text-sm mt-1">
            Ship cards from your{" "}
            <Link
              href="/dashboard/collections"
              className="text-cyan-400 hover:underline"
            >
              collection
            </Link>{" "}
            or after a pack reveal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const config = STATUS_CONFIG[shipment.status];
            const StatusIcon = config.icon;
            const trackUrl =
              shipment.trackingNumber && shipment.trackingCarrier
                ? getTrackingUrl(
                    shipment.trackingCarrier,
                    shipment.trackingNumber,
                    shipment.trackingUrl,
                  )
                : null;

            return (
              <div
                key={shipment.id}
                className="rounded-xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(12,20,28,.95), rgba(6,12,18,.95))",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-500">
                      {new Date(shipment.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border",
                      config.color,
                      config.border,
                    )}
                    style={{ background: "rgba(0,0,0,.4)" }}
                  >
                    <StatusIcon
                      className={cn(
                        "w-3 h-3",
                        shipment.status === "SENT_TO_WMS" && "animate-spin",
                      )}
                    />
                    {config.label}
                  </span>
                </div>

                {/* Items */}
                <div className="px-5 py-4">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {shipment.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.product.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            width={40}
                            height={40}
                            className="rounded object-cover w-10 h-10 border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-zinc-800 border border-white/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                        <span className="text-xs text-zinc-400 font-mono max-w-[120px] truncate">
                          {item.product.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping to */}
                  <p className="text-xs text-zinc-600 font-mono">
                    {shipment.shippingName} · {shipment.shippingCity},{" "}
                    {shipment.shippingState} {shipment.shippingPostal}
                  </p>

                  {/* Tracking */}
                  {shipment.trackingNumber && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">
                        {shipment.trackingCarrier?.toUpperCase()} ·{" "}
                        {shipment.trackingNumber}
                      </span>
                      {trackUrl && (
                        <a
                          href={trackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          Track
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Shipping method + fee */}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-zinc-600 font-mono capitalize">
                      {shipment.shippingMethod.toLowerCase().replace("_", " ")}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">
                      {shipment.shippingFeeAmount === 0
                        ? "Free"
                        : `$${(shipment.shippingFeeAmount / 100).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
