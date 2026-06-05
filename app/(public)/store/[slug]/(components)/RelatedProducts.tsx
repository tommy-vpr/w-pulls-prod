"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getTierConfig } from "@/lib/tier-config";
import { MetalTierBadge } from "../../(components)/Metaltierbadge";

interface RelatedProductsProps {
  products: Product[];
}

const tierColors: Record<string, string> = {
  COMMON: "#78ff7c",
  UNCOMMON: "#b1ffb5",
  RARE: "#7cc8ff",
  ULTRA_RARE: "#ffd97c",
  SECRET_RARE: "#ff7cff",
  BANGER: "#ff7c7c",
  GRAIL: "#ffd700",
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        const tierConfig = getTierConfig(product.tier);

        return (
          <Link
            key={product.id}
            href={`/store/${product.slug}`}
            className="group flex flex-col"
          >
            {/* Image Card */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-contain transition-transform duration-300 ease-out group-hover:scale-95"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="font-mono text-[#3de14d] text-sm">
                    NO IMAGE
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="mt-2 px-1">
              <h3 className="mt-1 font-mono font-medium text-gray-400 text-sm group-hover:text-gray-200 transition-colors">
                {product.title}
              </h3>
              <p
                className="mt-1 text-base font-bold font-mono text-[#78ff7c]"
                style={{ textShadow: "0 0 6px rgba(120,255,124,.4)" }}
              >
                ${product.price.toString()}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
