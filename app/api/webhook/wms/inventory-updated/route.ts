import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-api-key") !== process.env.WPULLS_CALLBACK_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sku, availableQuantity } = await request.json();
  await prisma.product.update({
    where: { sku },
    data: { inventory: availableQuantity, inventorySyncedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
