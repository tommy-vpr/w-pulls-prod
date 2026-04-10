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

export const metadata = { title: "Shipments" };

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; className: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
    icon: Clock,
  },
  PAID: {
    label: "Paid",
    className: "bg-amber-900/30 text-amber-400 border-amber-700/50",
    icon: Clock,
  },
  SENT_TO_WMS: {
    label: "Processing",
    className: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
    icon: Loader2,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-zinc-800/50 text-zinc-300 border-zinc-700",
    icon: Package,
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-emerald-900/30 text-emerald-400 border-emerald-700/50",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-900/30 text-emerald-400 border-emerald-700/50",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-900/30 text-red-400 border-red-700/50",
    icon: AlertCircle,
  },
};

const CARRIER_URLS: Record<string, (t: string) => string> = {
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
          product: { select: { title: true, imageUrl: true, tier: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Shipments</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Track your physical card shipments
        </p>
      </div>

      {shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="rounded-full bg-zinc-800 p-4 mb-4">
            <Truck className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-zinc-100">
            No shipments yet
          </h3>
          <p className="text-zinc-500 mt-1 text-sm">
            Ship cards from your{" "}
            <Link
              href="/dashboard/collections"
              className="text-zinc-300 hover:underline"
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
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs text-zinc-500 font-mono">
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                      config.className,
                    )}
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

                {/* Body */}
                <div className="px-5 py-4">
                  {/* Items */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {shipment.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.product.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover w-10 h-10 border border-zinc-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Package className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                        <span className="text-xs text-zinc-400 max-w-[120px] truncate">
                          {item.product.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <p className="text-xs text-zinc-600">
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
                          className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
                        >
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Method + fee */}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-zinc-600 capitalize">
                      {shipment.shippingMethod.toLowerCase().replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        shipment.shippingFeeAmount === 0
                          ? "text-emerald-400"
                          : "text-zinc-500",
                      )}
                    >
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
