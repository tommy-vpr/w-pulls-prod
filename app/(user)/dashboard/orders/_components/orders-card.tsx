"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  ShoppingBag,
  LucideIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getTierConfig, getTierBadgeClass } from "@/lib/tier-config";
import { OrderModal } from "./order-modal";
import { OrderStatus } from "@prisma/client";
import type { SerializedOrder } from "@/lib/services/order.service";

interface OrdersCardProps {
  orders: SerializedOrder[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const statusConfig: Record<
  OrderStatus,
  { icon: LucideIcon; color: string; bgColor: string; label: string }
> = {
  COMPLETED: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/40",
    label: "Completed",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-900/40",
    label: "Pending",
  },
  PROCESSING: {
    icon: Clock,
    color: "text-blue-400",
    bgColor: "bg-blue-900/40",
    label: "Processing",
  },
  FAILED: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-900/40",
    label: "Failed",
  },
  REFUNDED: {
    icon: RotateCcw,
    color: "text-blue-400",
    bgColor: "bg-blue-900/40",
    label: "Refunded",
  },
  ABANDONED: {
    icon: XCircle,
    color: "text-zinc-400",
    bgColor: "bg-zinc-800/40",
    label: "Abandoned",
  },
};

// ─── Stacked thumbnails for multi-item product orders ────────────────────────
function StackedImages({
  items,
  size = 48,
}: {
  items: SerializedOrder["items"];
  size?: number;
}) {
  const max = 5;
  const shown = items.slice(0, max);
  const extra = items.length - max;
  const hasExtra = extra > 0;
  const totalSlots = shown.length + (hasExtra ? 1 : 0);
  const offset = Math.floor(size * 0.35);
  const containerWidth = size + (totalSlots - 1) * offset;

  return (
    <div
      className="relative shrink-0"
      style={{ width: `${containerWidth}px`, height: `${size}px` }}
    >
      {shown.map((item, i) => (
        <div
          key={item.id}
          className="absolute rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: i * offset,
            zIndex: shown.length - i,
            boxShadow: "-2px 0 6px rgba(0,0,0,0.5)",
          }}
        >
          {item.product?.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-zinc-600" />
            </div>
          )}
        </div>
      ))}

      {hasExtra && (
        <div
          className="absolute rounded-lg bg-zinc-900 border border-zinc-600 border-dashed flex flex-col items-center justify-center gap-0.5"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: max * offset,
            zIndex: 0,
          }}
        >
          <span
            className="text-zinc-500 font-bold leading-none"
            style={{ fontSize: size * 0.2 }}
          >
            ···
          </span>
          <span
            className="text-zinc-400 font-semibold leading-none"
            style={{ fontSize: size * 0.22 }}
          >
            +{extra}
          </span>
        </div>
      )}
    </div>
  );
}

export function OrdersCard({ orders, pagination }: OrdersCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<SerializedOrder | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleQuickView = (order: SerializedOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="rounded-full bg-zinc-800 p-4 mb-4">
          <Sparkles className="h-8 w-8 text-zinc-500" />
        </div>
        <h3 className="text-lg font-medium text-zinc-100">No orders yet</h3>
        <p className="text-zinc-500 mt-1">
          Your orders will appear here after you open some packs.
        </p>
        <Link
          href="/packs"
          className="mt-4 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          Open Packs
        </Link>
      </div>
    );
  }

  const Pagination = () =>
    pagination.totalPages > 1 ? (
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Showing {orders.length} of {pagination.total} orders
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-sm text-zinc-500 px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {/* ── MOBILE CARD LIST ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => {
          const isProduct = order.type === "PRODUCT";
          const tier = getTierConfig(order.selectedTier);
          const status =
            statusConfig[order.status as OrderStatus] || statusConfig.PENDING;
          const StatusIcon = status.icon;
          const isRevealed = order.status === "COMPLETED" && order.product;

          // Value: for product orders sum all item prices × qty
          const productValue = isProduct
            ? order.items.reduce(
                (sum, i) => sum + Number(i.product?.price ?? 0) * i.quantity,
                0,
              )
            : null;

          // Title
          const title = isProduct
            ? order.items.length === 1
              ? (order.items[0]?.product?.title ?? "Product Order")
              : `${order.items.length} items`
            : isRevealed
              ? order.product!.title
              : order.packName;

          return (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 flex gap-3 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-[0.99]"
            >
              {/* Thumbnail */}
              <div className="shrink-0">
                {isProduct ? (
                  <StackedImages items={order.items} size={56} />
                ) : isRevealed && order.product?.imageUrl ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                    <Image
                      src={order.product.imageUrl}
                      alt={order.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-zinc-100 text-sm truncate">
                    {title}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium border border-current/20",
                      status.bgColor,
                      status.color,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs mt-1">
                  {isProduct ? (
                    <>
                      <span className="font-semibold text-zinc-300">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-500">
                        Paid ${(order.amount / 100).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "font-semibold",
                          isRevealed ? "text-emerald-400" : "text-zinc-500",
                        )}
                      >
                        {isRevealed
                          ? `$${Number(order.product!.price).toFixed(2)}`
                          : "???"}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-500">
                        Paid ${(order.amount / 100).toFixed(2)}
                      </span>
                      {order.selectedTier && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border",
                              getTierBadgeClass(order.selectedTier),
                            )}
                          >
                            {tier.label}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Order</TableHead>
              <TableHead className="text-zinc-400">Pack / Product</TableHead>
              <TableHead className="text-zinc-400">Tier</TableHead>
              <TableHead className="text-zinc-400">Value</TableHead>
              <TableHead className="text-zinc-400">Paid</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isProduct = order.type === "PRODUCT";
              const tier = getTierConfig(order.selectedTier);
              const status =
                statusConfig[order.status as OrderStatus] ||
                statusConfig.PENDING;
              const StatusIcon = status.icon;
              const isRevealed = order.status === "COMPLETED" && order.product;

              const totalItemValue = isProduct
                ? order.items.reduce(
                    (sum, i) =>
                      sum + Number(i.product?.price ?? 0) * i.quantity,
                    0,
                  )
                : null;

              const title = isProduct
                ? order.items.length === 1
                  ? (order.items[0]?.product?.title ?? "Product Order")
                  : `${order.items.length} items`
                : isRevealed
                  ? order.product!.title
                  : "Mystery Card";

              return (
                <TableRow
                  key={order.id}
                  className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Image + ID */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {isProduct ? (
                        <StackedImages items={order.items} size={48} />
                      ) : isRevealed && order.product?.imageUrl ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-800 border border-zinc-700 shrink-0">
                          <Image
                            src={order.product.imageUrl}
                            alt={order.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Sparkles className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-zinc-100 truncate max-w-[180px]">
                          {title}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Pack / Product label */}
                  <TableCell>
                    <span className="text-zinc-300">
                      {isProduct ? "Direct Purchase" : order.packName}
                    </span>
                  </TableCell>

                  {/* Tier */}
                  <TableCell>
                    {!isProduct && order.selectedTier ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border",
                          getTierBadgeClass(order.selectedTier),
                        )}
                      >
                        {tier.label}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Value */}
                  <TableCell>
                    {isProduct ? (
                      <span className="font-semibold text-zinc-300">
                        ${totalItemValue!.toFixed(2)}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          isRevealed ? "text-emerald-400" : "text-zinc-500",
                        )}
                      >
                        {isRevealed
                          ? `$${Number(order.product!.price).toFixed(2)}`
                          : "???"}
                      </span>
                    )}
                  </TableCell>

                  {/* Paid */}
                  <TableCell>
                    <span className="font-medium text-zinc-300">
                      ${(order.amount / 100).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border border-current/20",
                        status.bgColor,
                        status.color,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-sm text-zinc-500">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Link>
                      {!isProduct && isRevealed && (
                        <button
                          onClick={() => handleQuickView(order)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-200 hover:text-gray-300 hover:bg-gray-900/30 transition-colors"
                        >
                          View Card
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination />

      <OrderModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
