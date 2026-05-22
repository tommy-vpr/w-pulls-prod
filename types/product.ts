import { Product, ProductCategory, ProductTier } from "@prisma/client";

export type ProductWithoutDates = Omit<Product, "createdAt" | "updatedAt">;

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  cost: number | null;
  imageUrl: string | null;
  category: string | null;
  tier: ProductTier | null;
  inventory: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductFilters {
  category?: ProductCategory | string;
  /** Pass "untagged" to filter for null-tier products */
  tier?: ProductTier | "untagged" | string;
  isActive?: boolean;
  search?: string;
  stock?: "instock" | "outofstock" | "low";
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Serializable product type for client components
export interface SerializedProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  cost: string | null;
  imageUrl: string | null;
  category: string | null;
  tier: ProductTier | null;
  sku: string | null;
  inventory: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  weight?: string | null;
  weightUnit?: string | null;
  wmsVariantId?: string | null;
  inventorySyncedAt?: string | null;
}

export function serializeProduct(product: Product): SerializedProduct {
  return {
    ...product,
    price: product.price.toString(),
    cost: product.cost?.toString() ?? null,
    tier: product.tier ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    weight: product.weight?.toString() ?? null,
    weightUnit: product.weightUnit ?? null,
    wmsVariantId: product.wmsVariantId ?? null,
    inventorySyncedAt: product.inventorySyncedAt?.toISOString() ?? null,
  };
}

export function serializeProducts(products: Product[]): SerializedProduct[] {
  return products.map(serializeProduct);
}
