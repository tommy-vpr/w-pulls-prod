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

    // Load shipment request
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

    // Must belong to this user
    if (shipmentRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Must be in PENDING status
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

    // For free standard shipping — skip Stripe, mark directly as PAID and fire WMS
    if (amount === 0) {
      const updated = await prisma.shipmentRequest.update({
        where: { id: shipmentRequestId },
        data: { status: "PAID", paidAt: new Date() },
        include: {
          items: { include: { orderItem: true, product: true } },
          user: true,
        },
      });

      try {
        const { triggerWMSShipmentWebhook } =
          await import("@/lib/webhooks/wms");
        await triggerWMSShipmentWebhook(updated);
        await prisma.shipmentRequest.update({
          where: { id: shipmentRequestId },
          data: { status: "SENT_TO_WMS" },
        });

        if (updated.user?.email) {
          const { sendShipmentConfirmedEmail } =
            await import("@/lib/emails/send-shipment-confirmed");
          sendShipmentConfirmedEmail({
            to: updated.user.email,
            customerName: updated.user.name ?? "Customer",
            shipmentRequestId: updated.id,
            shippingMethod: updated.shippingMethod,
            shippingFeeAmount: updated.shippingFeeAmount,
            shippingAddress: {
              name: updated.shippingName,
              line1: updated.shippingLine1,
              line2: updated.shippingLine2,
              city: updated.shippingCity,
              state: updated.shippingState,
              postal: updated.shippingPostal,
              country: updated.shippingCountry,
            },
            items: updated.items.map((i: any) => ({
              title: i.product.title,
              imageUrl: i.product.imageUrl,
              tier: i.product.tier,
            })),
          }).catch((err) =>
            console.error("[Email] Confirmed email failed:", err),
          );
        }
      } catch (err) {
        console.error("[Shipments] WMS webhook failed:", err);
        await prisma.shipmentRequest.update({
          where: { id: shipmentRequestId },
          data: { status: "FAILED" },
        });
        return NextResponse.json(
          { error: "Failed to send to WMS" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        free: true,
        redirectUrl: `/dashboard/shipments?success=true`,
      });
    }

    // Build description from items
    const itemCount = shipmentRequest.items.length;
    const firstItem = shipmentRequest.items[0]?.product?.title ?? "Card";
    const description =
      itemCount === 1
        ? firstItem
        : `${firstItem} + ${itemCount - 1} more card${itemCount - 1 > 1 ? "s" : ""}`;

    // Create Stripe checkout session for paid shipping
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

    // Store Stripe session ID
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
