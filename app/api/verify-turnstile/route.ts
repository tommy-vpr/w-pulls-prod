import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile, getClientIp } from "@/lib/cloudflare/turnstile";
import {
  hasValidVerifiedCookie,
  setVerifiedCookieOnResponse,
} from "@/lib/cloudflare/verified-cookie";

export async function POST(request: NextRequest) {
  try {
    // Already verified — short-circuit, no token needed.
    if (await hasValidVerifiedCookie()) {
      return NextResponse.json({ success: true });
    }

    const { token } = (await request.json()) as { token?: string };
    const ip = getClientIp(request.headers);

    const result = await verifyTurnstile(token, ip);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Verification failed" },
        { status: 400 },
      );
    }

    const res = NextResponse.json({ success: true });
    setVerifiedCookieOnResponse(res);
    return res;
  } catch (err) {
    console.error("[Turnstile] Verify route error:", err);
    return NextResponse.json(
      { error: "Verification request failed" },
      { status: 500 },
    );
  }
}
