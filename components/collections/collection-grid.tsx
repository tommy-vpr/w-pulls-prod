// components/collections/collection-grid.tsx
"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { SerializedCollectionItem } from "@/lib/services/collection.service";
import { CollectionCard } from "./collection-card";
import { CollectionModal } from "./collection-modal";
import { ShipModal } from "@/components/shipments/ShipModal";
import { ItemDisposition } from "@prisma/client";
import { cn } from "@/lib/utils";

export function CollectionGrid({
  items,
}: {
  items: SerializedCollectionItem[];
}) {
  const [selectedItem, setSelectedItem] =
    useState<SerializedCollectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSoldBack, setShowSoldBack] = useState(false);

  // Ship selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showShipModal, setShowShipModal] = useState(false);

  const handleQuickView = (item: SerializedCollectionItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleToggleSelect = (orderItemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderItemId)) {
        next.delete(orderItemId);
      } else {
        next.add(orderItemId);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Filter items based on toggle
  const filteredItems = showSoldBack
    ? items
    : items.filter((item) => !item.isSoldBack);

  const soldBackCount = items.filter((i) => i.isSoldBack).length;
  const shippableItems = items.filter(
    (i) => i.disposition === ItemDisposition.KEPT,
  );

  // Build ship items from selected IDs
  const selectedShipItems = items
    .filter((i) => selectedIds.has(i.orderItemId))
    .map((i) => ({
      orderItemId: i.orderItemId,
      productId: i.productId,
      title: i.title,
      imageUrl: i.imageUrl,
      tier: i.tier,
    }));

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        No items yet — open some packs!
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          {shippableItems.length > 0 && selectedIds.size === 0 && (
            <button
              onClick={() => {
                // Select all shippable items
                setSelectedIds(
                  new Set(shippableItems.map((i) => i.orderItemId)),
                );
              }}
              className="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-400/20 text-cyan-400/70 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors font-mono"
            >
              Select All
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={handleClearSelection}
              className="cursor-pointer text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {soldBackCount > 0 && (
          <button
            onClick={() => setShowSoldBack(!showSoldBack)}
            className={cn(
              "cursor-pointer text-sm px-3 py-1.5 rounded-lg transition-colors",
              showSoldBack
                ? "bg-zinc-800 text-zinc-300"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-400",
            )}
          >
            {showSoldBack ? "Hide" : "Show"} sold back ({soldBackCount})
          </button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {filteredItems.map((item) => (
          <CollectionCard
            key={item.orderItemId}
            item={item}
            onQuickView={() => handleQuickView(item)}
            isSelected={selectedIds.has(item.orderItemId)}
            onToggleSelect={
              item.disposition === ItemDisposition.KEPT
                ? handleToggleSelect
                : undefined
            }
            selectionMode={selectedIds.size > 0}
          />
        ))}
      </div>

      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-12 text-zinc-500">
          All items have been sold back.{" "}
          <button
            onClick={() => setShowSoldBack(true)}
            className="text-emerald-400 hover:underline"
          >
            Show sold items
          </button>
        </div>
      )}

      {/* Sticky ship bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 p-4"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(6,12,18,.98) 30%)",
          }}
        >
          <div
            className="max-w-lg mx-auto flex items-center justify-between px-5 py-3 rounded-xl"
            style={{
              background: "rgba(12,20,28,.95)",
              border: "1px solid rgba(0,255,255,.3)",
              boxShadow: "0 0 30px rgba(0,255,255,.1)",
            }}
          >
            <span className="text-sm text-zinc-300 font-mono">
              <span className="text-cyan-400 font-semibold">
                {selectedIds.size}
              </span>{" "}
              card{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setShowShipModal(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-semibold text-sm transition-all"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,255,.15), rgba(0,255,255,.05))",
                border: "1px solid rgba(0,255,255,.4)",
                color: "#00ffff",
                textShadow: "0 0 6px rgba(0,255,255,.4)",
              }}
            >
              <Truck className="w-4 h-4" />
              Ship Selected
            </button>
          </div>
        </div>
      )}

      {/* Add bottom padding when sticky bar is showing */}
      {selectedIds.size > 0 && <div className="h-24" />}

      <CollectionModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {showShipModal && (
        <ShipModal
          isOpen={showShipModal}
          onClose={() => {
            setShowShipModal(false);
            handleClearSelection();
          }}
          items={selectedShipItems}
        />
      )}
    </>
  );
}
