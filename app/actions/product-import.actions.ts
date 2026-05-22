"use server";

import { revalidatePath } from "next/cache";
import { ProductCategory, ProductTier } from "@prisma/client";
import { productService } from "@/lib/services/product.service";
import { auth } from "@/lib/auth";
import { PACK_CONFIGS } from "@/lib/packs/config";
import { TIER_VALUE_BANDS } from "@/lib/packs/bands";
import { TIER_ORDER } from "@/lib/packs/ev";

export interface CsvRow {
  title: string;
  sku: string;
  price: string;
  cost: string;
}

export interface ImportResult {
  total: number;
  created: number;
  skipped: number; // blank/invalid rows
  untagged: number; // imported with null tier
  byTier: Record<ProductTier, number>;
  errors: Array<{ row: number; sku: string; reason: string }>;
}

export interface ImportPayload {
  rows: CsvRow[];
  defaultCategory: ProductCategory;
  defaultInventory: number;
  /** If true, infer tier from price (null when out of range). If false, use manualTier. */
  autoTier: boolean;
  /** Used when autoTier is false. Use null to import all as untagged. */
  manualTier: ProductTier | null;
}

/**
 * Pick the lowest tier whose band contains this price across all V3 packs.
 * Returns null if price fits no band — that product gets imported as untagged.
 */
function inferTierFromPrice(price: number): ProductTier | null {
  let lowestMatchIndex = Infinity;

  for (const pack of PACK_CONFIGS) {
    const packPriceDollars = pack.price / 100;

    for (let i = 0; i < TIER_ORDER.length; i++) {
      const tier = TIER_ORDER[i];
      if (!pack.odds[tier] || pack.odds[tier] <= 0) continue;

      const band = TIER_VALUE_BANDS[tier];
      const min = packPriceDollars * band.minMult;
      const max = packPriceDollars * band.maxMult;

      if (price >= min && price <= max) {
        if (i < lowestMatchIndex) {
          lowestMatchIndex = i;
        }
      }
    }
  }

  if (lowestMatchIndex === Infinity) return null;
  return TIER_ORDER[lowestMatchIndex];
}

export async function previewTiersAction(rows: CsvRow[]): Promise<
  Array<{
    sku: string;
    price: number;
    tier: ProductTier | null;
    fitsInPacks: string[];
  }>
> {
  return rows.map((row) => {
    const price = parseFloat(row.price);
    if (isNaN(price)) {
      return { sku: row.sku, price: 0, tier: null, fitsInPacks: [] };
    }

    const tier = inferTierFromPrice(price);

    const fitsInPacks: string[] = [];
    for (const pack of PACK_CONFIGS) {
      const packPriceDollars = pack.price / 100;
      for (const t of TIER_ORDER) {
        if (!pack.odds[t] || pack.odds[t] <= 0) continue;
        const band = TIER_VALUE_BANDS[t];
        const min = packPriceDollars * band.minMult;
        const max = packPriceDollars * band.maxMult;
        if (price >= min && price <= max) {
          fitsInPacks.push(pack.name);
          break;
        }
      }
    }

    return { sku: row.sku, price, tier, fitsInPacks };
  });
}

export async function importProductsFromCsvAction(
  payload: ImportPayload,
): Promise<{ success: boolean; result?: ImportResult; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const { rows, defaultCategory, defaultInventory, autoTier, manualTier } =
    payload;

  if (!rows || rows.length === 0) {
    return { success: false, error: "No rows to import" };
  }

  const result: ImportResult = {
    total: rows.length,
    created: 0,
    skipped: 0,
    untagged: 0,
    byTier: {
      COMMON: 0,
      UNCOMMON: 0,
      RARE: 0,
      ULTRA_RARE: 0,
      SECRET_RARE: 0,
      BANGER: 0,
      GRAIL: 0,
    },
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.title?.trim() || !row.sku?.trim() || !row.price?.trim()) {
      result.skipped++;
      continue;
    }

    const priceNum = parseFloat(row.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      result.errors.push({
        row: rowNum,
        sku: row.sku,
        reason: "Invalid price",
      });
      continue;
    }

    const costNum = row.cost?.trim() ? parseFloat(row.cost) : null;
    if (
      row.cost?.trim() &&
      (costNum === null || isNaN(costNum) || costNum < 0)
    ) {
      result.errors.push({
        row: rowNum,
        sku: row.sku,
        reason: "Invalid cost",
      });
      continue;
    }

    const sku = row.sku.trim().toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(sku)) {
      result.errors.push({
        row: rowNum,
        sku: row.sku,
        reason: "SKU must be uppercase letters, numbers, hyphens only",
      });
      continue;
    }

    // ── Tier resolution ────────────────────────────────────────────
    let tier: ProductTier | null;
    if (autoTier) {
      tier = inferTierFromPrice(priceNum);
      // null is valid — product gets imported as untagged
    } else {
      tier = manualTier;
    }

    try {
      const createResult = await productService.createProduct({
        title: row.title.trim(),
        description: null,
        price: row.price.trim(),
        cost: row.cost?.trim() || null,
        imageUrl: null,
        category: defaultCategory,
        tier, // ProductTier | null — service handles both
        sku,
        inventory: String(defaultInventory),
        isActive: true,
        weight: "0.3",
        weightUnit: "oz",
      });

      if (createResult.success) {
        result.created++;
        if (tier === null) {
          result.untagged++;
        } else {
          result.byTier[tier]++;
        }
      } else {
        result.errors.push({
          row: rowNum,
          sku,
          reason:
            createResult.error ||
            Object.values(createResult.errors || {})
              .flat()
              .join(", ") ||
            "Unknown error",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ row: rowNum, sku, reason: message });
    }
  }

  if (result.created > 0) {
    revalidatePath("/admin/products");
  }

  return { success: true, result };
}
