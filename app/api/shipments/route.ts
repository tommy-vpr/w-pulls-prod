// app/api/shipments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ItemDisposition } from "@prisma/client";

// ─── GET /api/shipments ───────────────────────────────────────────────────────
// List all shipment requests for the authenticated user

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shipments = await prisma.shipmentRequest.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              tier: true,
              sku: true,
            },
          },
          orderItem: {
            select: { orderId: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, shipments });
}

// ─── POST /api/shipments ──────────────────────────────────────────────────────
// Create a ShipmentRequest
// Body: {
//   items: [{ orderItemId: string }],
//   shippingName: string,
//   shippingLine1: string,
//   shippingLine2?: string,
//   shippingCity: string,
//   shippingState: string,
//   shippingPostal: string,
//   shippingCountry: string,
//   shippingMethod: "STANDARD" | "EXPRESS" | "OVERNIGHT"
// }

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,
      shippingName,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPostal,
      shippingCountry = "US",
      shippingMethod,
    } = body;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    if (
      !shippingName ||
      !shippingLine1 ||
      !shippingCity ||
      !shippingState ||
      !shippingPostal
    ) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 },
      );
    }

    if (!["STANDARD", "EXPRESS", "OVERNIGHT"].includes(shippingMethod)) {
      return NextResponse.json(
        { error: "Invalid shipping method" },
        { status: 400 },
      );
    }

    const orderItemIds: string[] = items.map((i: any) => i.orderItemId);

    // ── Validate each OrderItem ───────────────────────────────────────────────
    const orderItems = await prisma.orderItem.findMany({
      where: { id: { in: orderItemIds } },
      include: {
        order: true,
        product: true,
      },
    });

    if (orderItems.length !== orderItemIds.length) {
      return NextResponse.json(
        { error: "One or more items not found" },
        { status: 400 },
      );
    }

    for (const item of orderItems) {
      // Must belong to this user
      if (item.order.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Order must be completed and revealed
      if (item.order.status !== "COMPLETED" || !item.order.revealedAt) {
        return NextResponse.json(
          { error: `Order ${item.order.orderNumber} is not yet revealed` },
          { status: 400 },
        );
      }
      // Item must be KEPT — not already sold back or shipping
      if (item.disposition !== ItemDisposition.KEPT) {
        return NextResponse.json(
          {
            error: `Item ${item.product.title} is not available for shipping (disposition: ${item.disposition})`,
          },
          { status: 400 },
        );
      }
      // Product must have a SKU (required for WMS)
      if (!item.product.sku) {
        return NextResponse.json(
          { error: `Product ${item.product.title} is missing a SKU` },
          { status: 400 },
        );
      }
    }

    // ── Shipping fee amount ───────────────────────────────────────────────────
    const SHIPPING_FEE: Record<string, number> = {
      STANDARD: 0,
      EXPRESS: 999,
      OVERNIGHT: 1999,
    };
    const shippingFeeAmount = SHIPPING_FEE[shippingMethod];

    // ── Create ShipmentRequest + mark items ───────────────────────────────────
    const shipmentRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.shipmentRequest.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          shippingName,
          shippingLine1,
          shippingLine2: shippingLine2 || null,
          shippingCity,
          shippingState,
          shippingPostal,
          shippingCountry,
          shippingMethod,
          shippingFeeAmount,
          items: {
            create: orderItems.map((oi) => ({
              orderItemId: oi.id,
              productId: oi.productId,
            })),
          },
        },
      });

      // Mark each OrderItem as SHIP_REQUESTED
      await tx.orderItem.updateMany({
        where: { id: { in: orderItemIds } },
        data: { disposition: ItemDisposition.SHIP_REQUESTED },
      });

      return request;
    });

    return NextResponse.json({
      success: true,
      shipmentRequestId: shipmentRequest.id,
      shippingFeeAmount,
    });
  } catch (err) {
    console.error("[Shipments] Create error:", err);
    return NextResponse.json(
      { error: "Failed to create shipment request" },
      { status: 500 },
    );
  }
}
