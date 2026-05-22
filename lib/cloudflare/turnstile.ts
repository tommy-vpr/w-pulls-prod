// lib/turnstile.ts
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  "error-codes"?: string[];
}

export interface VerifyResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

/**
 * Verify a Turnstile token server-side.
 * Must be called from API routes / Server Actions only.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<VerifyResult> {
  if (!token) {
    return { success: false, error: "Missing verification token" };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[Turnstile] TURNSTILE_SECRET_KEY not configured");
    return { success: false, error: "Verification not configured" };
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip ?? undefined,
      }),
    });

    const data = (await res.json()) as TurnstileVerifyResponse;

    console.log("[Turnstile] Cloudflare responded:", {
      success: data.success,
      errors: data["error-codes"],
      hostname: data.hostname,
    });

    if (!data.success) {
      console.warn("[Turnstile] Verification failed:", data["error-codes"]);
      return {
        success: false,
        error: "Verification failed",
        errorCodes: data["error-codes"],
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[Turnstile] Verification error:", err);
    return { success: false, error: "Verification request failed" };
  }
}

/**
 * Pull the real client IP from request headers.
 * Coolify behind Cloudflare → check CF-Connecting-IP first, fall back to X-Forwarded-For.
 */
export function getClientIp(headers: Headers): string | null {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    null
  );
}
