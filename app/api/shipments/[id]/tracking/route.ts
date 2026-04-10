// app/api/shipments/[id]/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ItemDisposition } from "@prisma/client";

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
    const { trackingNumber, carrier, trackingUrl } = await request.json();

    if (!trackingNumber || !carrier) {
      return NextResponse.json(
        { error: "trackingNumber and carrier are required" },
        { status: 400 },
      );
    }

    // Load shipment request with items
    const shipmentRequest = await prisma.shipmentRequest.findUnique({
      where: { id: shipmentRequestId },
      include: {
        items: {
          include: {
            product: { select: { title: true, imageUrl: true } },
            orderItem: { select: { id: true } },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    if (!shipmentRequest) {
      return NextResponse.json(
        { error: "Shipment request not found" },
        { status: 404 },
      );
    }

    // Update ShipmentRequest + OrderItem dispositions in one transaction
    await prisma.$transaction(async (tx) => {
      // Mark shipment as SHIPPED
      await tx.shipmentRequest.update({
        where: { id: shipmentRequestId },
        data: {
          status: "SHIPPED",
          trackingNumber,
          trackingCarrier: carrier,
          trackingUrl: trackingUrl || null,
          shippedAt: new Date(),
        },
      });

      // Mark all items as SHIPPED
      const orderItemIds = shipmentRequest.items.map((i) => i.orderItemId);
      await tx.orderItem.updateMany({
        where: { id: { in: orderItemIds } },
        data: { disposition: ItemDisposition.SHIPPED },
      });
    });

    console.log(
      `[Tracking] ✅ Shipment ${shipmentRequestId} marked SHIPPED — ${trackingNumber} (${carrier})`,
    );

    // Send tracking email
    if (shipmentRequest.user?.email) {
      const { sendTrackingEmail } =
        await import("@/lib/emails/send-tracking-email");
      sendTrackingEmail({
        to: shipmentRequest.user.email,
        customerName: shipmentRequest.user.name ?? "Customer",
        trackingNumber,
        carrier,
        trackingUrl,
        items: shipmentRequest.items.map((i) => ({
          title: i.product.title,
          imageUrl: i.product.imageUrl,
        })),
        shippingAddress: {
          name: shipmentRequest.shippingName,
          line1: shipmentRequest.shippingLine1,
          line2: shipmentRequest.shippingLine2,
          city: shipmentRequest.shippingCity,
          state: shipmentRequest.shippingState,
          postal: shipmentRequest.shippingPostal,
          country: shipmentRequest.shippingCountry,
        },
      }).catch((err) =>
        console.error("[Tracking] Email failed (non-fatal):", err),
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Tracking] Error:", err);
    return NextResponse.json(
      { error: "Failed to update tracking" },
      { status: 500 },
    );
  }
}
