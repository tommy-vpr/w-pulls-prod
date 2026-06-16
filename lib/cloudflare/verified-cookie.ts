// lib/cloudflare/verified-cookie.ts
import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
// append to lib/cloudflare/verified-cookie.ts
import type { NextResponse } from "next/server";

const COOKIE_NAME = "ts_verified";
const TTL_SECONDS = 30 * 60; // 30 min — re-challenge after this

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set — required to sign ts_verified");
  return s;
}

function sign(expISO: string): string {
  return crypto.createHmac("sha256", secret()).update(expISO).digest("hex");
}

/** Build the cookie value: "<expiryISO>.<hmac>" */
function buildValue(): { value: string; maxAge: number } {
  const exp = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  return { value: `${exp}.${sign(exp)}`, maxAge: TTL_SECONDS };
}

/** Set the verified cookie. Call after a successful Turnstile verification. */
export async function setVerifiedCookie(): Promise<void> {
  const { value, maxAge } = buildValue();
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/** True if a valid, unexpired verified cookie is present. */
export async function hasValidVerifiedCookie(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const idx = raw.lastIndexOf(".");
  if (idx === -1) return false;

  const expISO = raw.slice(0, idx);
  const mac = raw.slice(idx + 1);

  // constant-time signature check
  const expected = sign(expISO);
  if (
    mac.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  ) {
    return false;
  }

  const exp = Date.parse(expISO);
  return Number.isFinite(exp) && exp > Date.now();
}

/** Set the verified cookie directly on a NextResponse (for Route Handlers). */
export function setVerifiedCookieOnResponse(res: NextResponse): void {
  const { value, maxAge } = buildValue();
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}
