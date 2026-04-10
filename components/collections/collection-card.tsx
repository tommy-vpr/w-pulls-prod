// components/collections/collection-card.tsx
"use client";

import Image from "next/image";
import { Expand, Truck } from "lucide-react";
import { SerializedCollectionItem } from "@/lib/services/collection.service";
import { cn } from "@/lib/utils";
import { getTierConfig, getTierBadgeClass } from "@/lib/tier-config";
import { ItemDisposition } from "@prisma/client";

interface CollectionCardProps {
  item: SerializedCollectionItem;
  onQuickView: () => void;
  isSelected?: boolean;
  onToggleSelect?: (orderItemId: string) => void;
  selectionMode?: boolean;
}

export function CollectionCard({
  item,
  onQuickView,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}: CollectionCardProps) {
  const tier = getTierConfig(item.tier);
  const isShippable = item.disposition === ItemDisposition.KEPT;

  return (
    <div className="group flex flex-col gap-2">
      <div
        className={cn(
          "relative rounded-xl overflow-hidden border bg-zinc-900/50 transition-all duration-200",
          item.isSoldBack
            ? "border-zinc-800/50 opacity-60"
            : isSelected
              ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-3 ring-offset-black"
              : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
        )}
      >
        <div className="relative aspect-[3/4]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className={cn("object-cover", item.isSoldBack && "grayscale")}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-600">
              ?
            </div>
          )}

          {/* Tier Badge */}
          <span
            className={cn(
              "absolute top-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border backdrop-blur-sm z-10",
              getTierBadgeClass(item.tier),
            )}
          >
            {tier.label}
          </span>

          {/* Selected checkmark — top right */}
          {isSelected && (
            <div className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg pointer-events-none">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Sold Back Overlay */}
          {item.isSoldBack && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-1">
                <span className="text-zinc-50 font-semibold">Sold Back</span>
                <span className="text-emerald-400 text-sm font-medium">
                  +${((item.buybackAmount ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Ship Requested Overlay */}
          {item.disposition === ItemDisposition.SHIP_REQUESTED && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-zinc-300" />
                <span className="text-zinc-300 font-semibold text-xs">
                  Ship Requested
                </span>
              </div>
            </div>
          )}

          {/* Shipped Overlay */}
          {item.disposition === ItemDisposition.SHIPPED && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-xs">
                  Shipped
                </span>
              </div>
            </div>
          )}

          {/* 
            HOVER OVERLAY — only shown when NOT in selection mode.
            Shows View Card + Select to Ship for shippable items.
          */}
          {!item.isSoldBack &&
            !selectionMode &&
            isShippable &&
            onToggleSelect && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-2">
                <button
                  onClick={onQuickView}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors"
                >
                  <Expand className="h-4 w-4" />
                  View Card
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item.orderItemId);
                  }}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Select to Ship
                </button>
              </div>
            )}

          {/* Selection mode hover overlay — subtle add indicator */}
          {!item.isSoldBack &&
            selectionMode &&
            isShippable &&
            onToggleSelect && (
              <div className="absolute inset-0 z-20">
                {/* Invisible click target */}
                <button
                  onClick={() => onToggleSelect(item.orderItemId)}
                  className="absolute inset-0 cursor-pointer"
                />
                {/* Hover ring hint — only on unselected cards */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 border border-zinc-700 text-white text-xs font-medium">
                      <Truck className="h-3.5 w-3.5" />
                      Add to shipment
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Non-shippable hover overlay */}
          {!item.isSoldBack &&
            !selectionMode &&
            (!isShippable || !onToggleSelect) && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                <button
                  onClick={onQuickView}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors"
                >
                  <Expand className="h-4 w-4" />
                  View Card
                </button>
              </div>
            )}

          {/* 
            SELECTION MODE — invisible full-card button for tap-to-toggle.
            No hover overlay in this mode — just tap to select/deselect.
            Sits above the image but below the checkmark badge.
          */}
          {!item.isSoldBack &&
            selectionMode &&
            isShippable &&
            onToggleSelect && (
              <button
                onClick={() => onToggleSelect(item.orderItemId)}
                className="absolute inset-0 z-20 cursor-pointer"
                aria-label={isSelected ? "Deselect card" : "Select card"}
              />
            )}
        </div>
      </div>

      {/* Info */}
      <div className="px-1">
        <p className="font-medium text-zinc-200 truncate text-sm">
          {item.title}
        </p>
        {item.isSoldBack ? (
          <p className="text-xs text-zinc-500 line-through">
            ${item.value.toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-zinc-400">${item.value.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}
