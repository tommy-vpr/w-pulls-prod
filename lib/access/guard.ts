// lib/access/guard.ts
import { NextResponse } from "next/server";
import { canUseMoneyLoop } from "./internal-allowlist";

/** Returns a 403 NextResponse if the user can't use the money loop, else null. */
export function moneyLoopGuard(email?: string | null): NextResponse | null {
  if (canUseMoneyLoop(email)) return null;
  return NextResponse.json(
    {
      success: false,
      error:
        "W-Pulls is temporarily unavailable while we finalize a few things.",
    },
    { status: 403 },
  );
}
