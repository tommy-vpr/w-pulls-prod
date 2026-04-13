// app/api/shipments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ItemDisposition } from "@prisma/client";

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
          orderItem: { select: { orderId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, shipments });
}

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

    const orderItems = await prisma.orderItem.findMany({
      where: { id: { in: orderItemIds } },
      include: { order: true, product: true },
    });

    if (orderItems.length !== orderItemIds.length) {
      return NextResponse.json(
        { error: "One or more items not found" },
        { status: 400 },
      );
    }

    for (const item of orderItems) {
      if (item.order.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (item.order.status !== "COMPLETED") {
        return NextResponse.json(
          { error: `Order ${item.order.orderNumber} is not completed` },
          { status: 400 },
        );
      }

      // PACK orders require reveal — PRODUCT orders do not
      if (item.order.type === "PACK" && !item.order.revealedAt) {
        return NextResponse.json(
          {
            error: `Order ${item.order.orderNumber} has not been revealed yet`,
          },
          { status: 400 },
        );
      }

      // PRODUCT orders are fulfilled automatically via WMS
      if (item.order.type === "PRODUCT") {
        return NextResponse.json(
          { error: `Product orders are fulfilled automatically` },
          { status: 400 },
        );
      }

      if (item.disposition !== ItemDisposition.KEPT) {
        return NextResponse.json(
          {
            error: `Item ${item.product.title} is not available for shipping (disposition: ${item.disposition})`,
          },
          { status: 400 },
        );
      }

      if (!item.product.sku) {
        return NextResponse.json(
          { error: `Product ${item.product.title} is missing a SKU` },
          { status: 400 },
        );
      }
    }

    const SHIPPING_FEE: Record<string, number> = {
      STANDARD: 0,
      EXPRESS: 999,
      OVERNIGHT: 1999,
    };
    const shippingFeeAmount = SHIPPING_FEE[shippingMethod];

    const shipmentRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.shipmentRequest.create({
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

      await tx.orderItem.updateMany({
        where: { id: { in: orderItemIds } },
        data: { disposition: ItemDisposition.SHIP_REQUESTED },
      });

      return req;
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
