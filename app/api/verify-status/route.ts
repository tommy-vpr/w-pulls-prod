import { NextResponse } from "next/server";
import { hasValidVerifiedCookie } from "@/lib/cloudflare/verified-cookie";

export async function GET() {
  return NextResponse.json({ verified: await hasValidVerifiedCookie() });
}
