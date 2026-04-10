// components/collections/collection-card.tsx
"use client";

import Image from "next/image";
import { Expand } from "lucide-react";
import { SerializedCollectionItem } from "@/lib/services/collection.service";
import { cn } from "@/lib/utils";
import { getTierConfig, getTierBadgeClass } from "@/lib/tier-config";
import { ItemDisposition } from "@prisma/client";

interface CollectionCardProps {
  item: SerializedCollectionItem;
  onQuickView: () => void;
  // Ship selection props
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
      {/* Card image */}
      <div
        className={cn(
          "relative rounded-lg overflow-hidden border bg-zinc-900/60 transition-all",
          item.isSoldBack
            ? "border-zinc-800/50 opacity-75"
            : isSelected
              ? "border-cyan-400/60 shadow-lg shadow-cyan-400/10"
              : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-black/20",
        )}
      >
        {/* Selection checkbox — only for KEPT items */}
        {isShippable && onToggleSelect && (
          <button
            onClick={() => onToggleSelect(item.orderItemId)}
            className="cursor-pointer absolute top-2 right-2 z-20 w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{
              background: isSelected ? "rgba(0,255,255,1)" : "rgba(0,0,0,.6)",
              border: isSelected
                ? "1px solid rgba(0,255,255,.8)"
                : "1px solid rgba(255,255,255,.3)",
            }}
          >
            {isSelected && (
              <svg
                className="w-3 h-3 text-black"
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
            )}
          </button>
        )}

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
              "absolute top-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border backdrop-blur-sm",
              getTierBadgeClass(item.tier),
            )}
          >
            {tier.label}
          </span>

          {/* Sold Back Overlay */}
          {item.isSoldBack && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <span className="text-red-500 font-bold text-4xl">
                  Sold Back
                </span>
                <span className="text-white text-xl">
                  +${((item.buybackAmount ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Ship Requested Overlay */}
          {item.disposition === ItemDisposition.SHIP_REQUESTED && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-1">
                <span className="text-cyan-400 font-bold text-sm font-mono">
                  SHIP REQUESTED
                </span>
              </div>
            </div>
          )}

          {/* Shipped Overlay */}
          {item.disposition === ItemDisposition.SHIPPED && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="text-blue-400 font-bold text-sm font-mono">
                SHIPPED
              </span>
            </div>
          )}

          {/* Hover Overlay — only when not in selection mode and not sold */}
          {!item.isSoldBack && !selectionMode && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={onQuickView}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                <Expand className="h-4 w-4" />
                View Card
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info — outside the card */}
      <div className="px-1">
        <p className="font-medium text-white truncate text-sm">{item.title}</p>
        {item.isSoldBack ? (
          <p className="text-xs text-zinc-500 line-through">
            ${item.value.toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-gray-400">${item.value.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}
