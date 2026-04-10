// app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { packRevealQueue } from "@/lib/queue/packReveal.queue";
import { productFulfillmentQueue } from "@/lib/queue/productFulfillment.queue";
import { claimWebhookEvent } from "@/lib/utils/webhook-idempotency";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  // Idempotency: skip if this event was already processed
  const isNew = await claimWebhookEvent(event.id);
  if (!isNew) {
    console.log(`⏭️ Webhook event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.amount_total) {
    console.error("Missing amount_total", session.id);
    return NextResponse.json({ received: true });
  }

  // ---- Handle wallet deposits ----
  if (session.metadata?.type === "wallet_deposit") {
    const userId = session.metadata.userId;
    const depositAmount = parseInt(session.metadata.depositAmount, 10);

    if (!userId || !depositAmount) {
      console.error("Invalid wallet deposit metadata", session.id);
      return NextResponse.json({ received: true });
    }

    try {
      const { walletService } = await import("@/lib/services/wallet.service");
      const { WalletTransactionReason } = await import("@prisma/client");

      await walletService.credit({
        userId,
        amount: depositAmount,
        reason: WalletTransactionReason.DEPOSIT,
        notes: `Wallet deposit via Stripe (${session.id})`,
      });

      console.log(
        `✅ Wallet deposit: $${(depositAmount / 100).toFixed(2)} → user ${userId}`,
      );
    } catch (err) {
      console.error("Wallet deposit credit failed:", err);
    }

    return NextResponse.json({ received: true });
  }

  // --------------- Shipment ------------------

  if (session.metadata?.type === "shipping_fee") {
    const { shipmentRequestId } = session.metadata;
    const shipmentRequest = await prisma.shipmentRequest.update({
      where: { id: shipmentRequestId },
      data: { status: "PAID", paidAt: new Date() },
      include: {
        items: { include: { orderItem: true, product: true } },
        user: true,
      },
    });
    try {
      const { triggerWMSShipmentWebhook } = await import("@/lib/webhooks/wms");
      await triggerWMSShipmentWebhook(shipmentRequest);
      await prisma.shipmentRequest.update({
        where: { id: shipmentRequestId },
        data: { status: "SENT_TO_WMS" },
      });
    } catch (err) {
      console.error("[Webhook] WMS shipment failed:", err);
      await prisma.shipmentRequest.update({
        where: { id: shipmentRequestId },
        data: { status: "FAILED" },
      });
    }
    return NextResponse.json({ received: true });
  }

  // ---- Handle order checkouts ----
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.status !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  // New location in stripe@18+ API
  const address = session.collected_information?.shipping_details?.address;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PROCESSING",
      stripeSessionId: session.id,

      subtotal: session.amount_subtotal ?? 0,
      tax: session.total_details?.amount_tax ?? 0,
      shipping: session.shipping_cost?.amount_total ?? 0,
      amount: session.amount_total,

      customerEmail: session.customer_details?.email ?? order.customerEmail,
      customerName: session.customer_details?.name ?? order.customerName,

      shippingLine1: address?.line1 ?? null,
      shippingLine2: address?.line2 ?? null,
      shippingCity: address?.city ?? null,
      shippingState: address?.state ?? null,
      shippingPostal: address?.postal_code ?? null,
      shippingCountry: address?.country ?? null,
    },
  });

  if (order.type === "PRODUCT") {
    await productFulfillmentQueue.add(
      "fulfill-product",
      { orderId },
      { jobId: orderId },
    );
  }

  if (order.type === "PACK") {
    const packId = session.metadata?.packId;
    if (!packId) {
      console.error("Missing packId for PACK order", orderId);
      return NextResponse.json({ received: true });
    }

    await packRevealQueue.add(
      "assign-reveal",
      {
        orderId,
        packId,
        stripeSessionId: session.id,
      },
      { jobId: orderId },
    );
  }

  return NextResponse.json({ received: true });
}
