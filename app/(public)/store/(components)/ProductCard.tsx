"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTierConfig } from "@/lib/tier-config";
import { SerializedProduct } from "@/types/product";
import { MetalTierBadge } from "./Metaltierbadge";

interface ProductCardProps {
  product: SerializedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const tierConfig = getTierConfig(product.tier);

  return (
    <div className="">
      <Link
        href={`/store/${product.slug}`}
        className="group relative flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] h-full rounded-xl overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-contain transition-transform duration-300 ease-out group-hover:scale-95"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-zinc-600 text-sm">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content Overlay - Bottom */}
      <div className="relative mt-2">
        <h3 className="font-['Oxanium',monospace] text-zinc-300 line-clamp-2 text-xs sm:text-base drop-shadow-lg">
          {product.title}
        </h3>

        <div className="font-mono flex items-center justify-between">
          <p
            className="text-base font-mono text-green-400"
            style={{ textShadow: "0 0 6px rgba(120,255,124,.4)" }}
          >
            ${product.price.toString()}
          </p>

          {!product.isActive && (
            <span className="text-xs text-zinc-400 bg-zinc-800/80 backdrop-blur-sm px-2 py-1 rounded">
              Sold
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
