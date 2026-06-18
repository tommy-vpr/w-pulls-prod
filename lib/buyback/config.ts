// lib/buyback/config.ts

import { ProductTier } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

// ===========================================
// BUYBACK RATES BY TIER
// ===========================================

/**
 * Percentage of product value offered for buyback (0.0 - 1.0)
 * Higher tiers get better rates to incentivize keeping lower-value cards
 */
const FLAT_BUYBACK_RATE = 0.9; // 90% across all tiers

export const BUYBACK_RATES: Record<ProductTier, number> = Object.fromEntries(
  Object.values(ProductTier).map((tier) => [tier, FLAT_BUYBACK_RATE]),
) as Record<ProductTier, number>;

/**
 * Get the buyback rate for a given tier
 */
export function getBuybackRate(tier: ProductTier): number {
  return BUYBACK_RATES[tier] ?? 0.5;
}

/**
 * Calculate the buyback amount for a product
 * @param productPriceCents - Product price in cents
 * @param tier - Product tier
 * @returns Buyback amount in cents
 */
export function calculateBuybackAmount(
  productPriceCents: number,
  tier: ProductTier,
): number {
  const rate = getBuybackRate(tier);
  return Math.floor(productPriceCents * rate);
}

// ===========================================
// QUOTE EXPIRATION
// ===========================================

/**
 * How long a buyback quote is valid (in seconds)
 * After this, user must request a new quote
 */
export const QUOTE_EXPIRATION_SECONDS = 600; // 10 minutes

/**
 * Fixed sellback window, anchored to revealedAt. NOT resettable per quote.
 * This is the real gate — the quote token's own expiry is only a freshness bound.
 */
export const SELLBACK_WINDOW_SECONDS = 600; // 10 min from reveal

export function getSellbackDeadline(revealedAt: Date): Date {
  return new Date(revealedAt.getTime() + SELLBACK_WINDOW_SECONDS * 1000);
}

export function isWithinSellbackWindow(revealedAt: Date | null): boolean {
  if (!revealedAt) return false;
  return Date.now() < getSellbackDeadline(revealedAt).getTime();
}

/**
 * Minimum buyback amount in cents
 * Prevents micro-transactions
 */
export const MINIMUM_BUYBACK_AMOUNT = 100; // $1.00

// ===========================================
// WITHDRAWAL SETTINGS
// ===========================================

/**
 * Minimum withdrawal amount in cents
 */
export const MINIMUM_WITHDRAWAL_AMOUNT = 1000; // $10.00

/**
 * Maximum withdrawal amount per request in cents
 * Set to null for no limit
 */
export const MAXIMUM_WITHDRAWAL_AMOUNT: number | null = null; // No limit

/**
 * Hold period for new credits before they can be withdrawn (in hours)
 * Helps prevent chargeback fraud
 * Set to 0 to disable
 */
export const CREDIT_HOLD_PERIOD_HOURS = 24; // 24hr (chargeback protection)

/**
 * Require minimum account age for first withdrawal (in days)
 * Set to 0 to disable
 */
export const MINIMUM_ACCOUNT_AGE_DAYS = 0;

// ===========================================
// QUOTE TOKEN SIGNING
// ===========================================

const QUOTE_SECRET = new TextEncoder().encode(
  process.env.BUYBACK_QUOTE_SECRET ||
    process.env.AUTH_SECRET ||
    "fallback-secret-change-me",
);

export interface QuotePayload {
  orderItemId: string;
  userId: string;
  amount: number;
  tier: ProductTier;
  productId: string;
  exp: number;
}

/**
 * Generate a signed quote token
 * This ensures the quote can't be tampered with
 */
export async function generateQuoteToken(
  payload: Omit<QuotePayload, "exp">,
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + QUOTE_EXPIRATION_SECONDS;

  const token = await new SignJWT({ ...payload, exp: expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(QUOTE_SECRET);

  return token;
}

/**
 * Verify and decode a quote token
 * Returns null if invalid or expired
 */
export async function verifyQuoteToken(
  token: string,
): Promise<QuotePayload | null> {
  try {
    const { payload } = await jwtVerify(token, QUOTE_SECRET);
    return payload as unknown as QuotePayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get expiration timestamp for a new quote
 */
export function getQuoteExpiresAt(): Date {
  return new Date(Date.now() + QUOTE_EXPIRATION_SECONDS * 1000);
}

/**
 * Get seconds remaining on a quote
 */
export function getQuoteSecondsRemaining(expiresAt: Date): number {
  const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}
