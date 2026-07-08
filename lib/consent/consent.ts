// lib/consent/consent.ts
// Cookie-consent state: categories, defaults, and read/write helpers.
// A single first-party cookie stores the user's choices so they persist
// across sessions and can be re-read server-side if ever needed.

export const CONSENT_COOKIE = "wpulls_consent";

// Bump when the set of categories or their meaning changes. A stored
// consent whose version < CONSENT_VERSION is treated as "no decision yet",
// so the banner re-appears and we re-collect consent.
export const CONSENT_VERSION = 1;

// ~6 months. GDPR guidance is that consent shouldn't be indefinite; re-ask
// periodically. Adjust to taste.
export const CONSENT_MAX_AGE_DAYS = 180;

export type ConsentCategory = "essential" | "analytics";

export interface ConsentState {
  version: number;
  // Essential is always true — it's shown in the UI locked on, purely so the
  // user understands what "essential" covers. It is never actually optional.
  essential: true;
  analytics: boolean;
  // ISO timestamp of when the decision was recorded (audit / re-ask logic).
  decidedAt: string;
}

// What we start from before any decision: everything non-essential denied.
// This is the GDPR-safe default — nothing but strictly-necessary runs until
// the user actively opts in.
export function defaultDeniedState(): ConsentState {
  return {
    version: CONSENT_VERSION,
    essential: true,
    analytics: false,
    decidedAt: new Date().toISOString(),
  };
}

export function grantAllState(): ConsentState {
  return {
    version: CONSENT_VERSION,
    essential: true,
    analytics: true,
    decidedAt: new Date().toISOString(),
  };
}

// ── Client-side cookie access ────────────────────────────────────────
// Kept dependency-free (no js-cookie) since it's a single cookie.

export function readConsentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));

  if (!match) return null;

  try {
    const raw = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(raw) as Partial<ConsentState>;

    // Stale schema → force a fresh decision.
    if (parsed.version !== CONSENT_VERSION) return null;

    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: Boolean(parsed.analytics),
      decidedAt:
        typeof parsed.decidedAt === "string"
          ? parsed.decidedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsentCookie(state: ConsentState): void {
  if (typeof document === "undefined") return;

  const value = encodeURIComponent(JSON.stringify(state));
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  // SameSite=Lax is correct for a consent cookie: it's first-party and read
  // on top-level navigations. Not HttpOnly — the client needs to read it to
  // decide what to load.
  document.cookie =
    `${CONSENT_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax` +
    secure;
}
