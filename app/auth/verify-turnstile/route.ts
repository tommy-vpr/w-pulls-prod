// app/api/auth/verify-turnstile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile, getClientIp } from "@/lib/cloudflare/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string };
    const ip = getClientIp(request.headers);

    const result = await verifyTurnstile(token, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Verification failed" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Turnstile] Verify route error:", err);
    return NextResponse.json(
      { error: "Verification request failed" },
      { status: 500 },
    );
  }
}
