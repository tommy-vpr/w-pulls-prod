// app/api/shipments/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { SHIPPING_RATES } from "@/lib/shipments/config";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shipmentRequestId } = await request.json();

    if (!shipmentRequestId) {
      return NextResponse.json(
        { error: "shipmentRequestId is required" },
        { status: 400 },
      );
    }

    const shipmentRequest = await prisma.shipmentRequest.findUnique({
      where: { id: shipmentRequestId },
      include: {
        items: {
          include: {
            product: { select: { title: true, imageUrl: true } },
          },
        },
      },
    });

    if (!shipmentRequest) {
      return NextResponse.json(
        { error: "Shipment request not found" },
        { status: 404 },
      );
    }

    if (shipmentRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (shipmentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Shipment is already ${shipmentRequest.status}` },
        { status: 400 },
      );
    }

    const method =
      shipmentRequest.shippingMethod as keyof typeof SHIPPING_RATES;
    const rate = SHIPPING_RATES[method];
    const amount = shipmentRequest.shippingFeeAmount;

    if (!amount || amount <= 0) {
      // Defensive: should never happen with the new paid-only config,
      // but explicitly reject rather than silently shipping for free.
      return NextResponse.json(
        { error: "Invalid shipping fee" },
        { status: 400 },
      );
    }

    // Build a clean line-item description
    const itemCount = shipmentRequest.items.length;
    const firstItem = shipmentRequest.items[0]?.product?.title ?? "Card";
    const description =
      itemCount === 1
        ? firstItem
        : `${firstItem} + ${itemCount - 1} more card${itemCount - 1 > 1 ? "s" : ""}`;

    // Create Stripe checkout session — WMS gets notified later, via Stripe webhook
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `${rate.label} — ${description}`,
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shipments?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/shipments?canceled=true`,
      metadata: {
        type: "shipping_fee",
        shipmentRequestId: shipmentRequest.id,
        userId: session.user.id,
      },
      customer_email: session.user.email ?? undefined,
    });

    await prisma.shipmentRequest.update({
      where: { id: shipmentRequestId },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (err) {
    console.error("[Shipments] Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
