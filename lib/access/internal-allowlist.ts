// lib/access/internal-allowlist.ts
//
// Temporary internal-only lockdown for the W-Pulls money loop
// (pack purchase, buyback, withdrawals) while awaiting legal review.
//
// Fail-closed: if INTERNAL_ALLOWLIST is unset/empty, NOBODY passes.
// To re-open to the public later: remove the gate calls (or set a
// WPULLS_PUBLIC_ENABLED kill switch — see isMoneyLoopOpen below).

const ALLOWED = (process.env.INTERNAL_ALLOWLIST ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** True only for explicitly allowlisted internal accounts. Fail-closed. */
export function isInternalUser(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED.includes(email.toLowerCase());
}

/**
 * Global state of the public money loop.
 * - If WPULLS_PUBLIC_ENABLED === "true" → loop is public (normal operation).
 * - Otherwise → loop is locked; only internal users pass.
 * Default (unset) = locked. Fail-closed.
 */
export function isMoneyLoopPublic(): boolean {
  return process.env.WPULLS_PUBLIC_ENABLED === "true";
}

/** The single check to use everywhere: may this user use the money loop? */
export function canUseMoneyLoop(email?: string | null): boolean {
  return isMoneyLoopPublic() || isInternalUser(email);
}
