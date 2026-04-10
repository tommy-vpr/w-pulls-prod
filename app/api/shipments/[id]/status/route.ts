// app/api/shipments/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

// Maps WMS status strings to W-Pulls ShipmentStatus enum
const WMS_STATUS_MAP: Record<string, ShipmentStatus> = {
  IN_PROGRESS: ShipmentStatus.IN_PROGRESS,
  PICKED: ShipmentStatus.IN_PROGRESS, // no separate PICKED state in W-Pulls
  PACKED: ShipmentStatus.IN_PROGRESS, // no separate PACKED state in W-Pulls
  SHIPPED: ShipmentStatus.SHIPPED,
  FAILED: ShipmentStatus.FAILED,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate WMS callback secret
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.WPULLS_CALLBACK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentRequestId } = await params;
    const { status, wmsOrderId } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    const mappedStatus = WMS_STATUS_MAP[status];
    if (!mappedStatus) {
      // Unknown status — acknowledge but don't update
      console.warn(`[Status] Unknown WMS status: ${status} — ignoring`);
      return NextResponse.json({ success: true, ignored: true });
    }

    const updateData: any = { status: mappedStatus };
    if (wmsOrderId) {
      updateData.wmsOrderId = wmsOrderId;
    }

    await prisma.shipmentRequest.update({
      where: { id: shipmentRequestId },
      data: updateData,
    });

    console.log(
      `[Status] Shipment ${shipmentRequestId} → ${mappedStatus} (WMS: ${status})`,
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // P2025 = record not found
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Shipment request not found" },
        { status: 404 },
      );
    }
    console.error("[Status] Error:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
