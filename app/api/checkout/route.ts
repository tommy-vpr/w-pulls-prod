// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { packById } from "@/lib/packs/config";
import { auditService } from "@/lib/services/audit.service";
import { auth } from "@/lib/auth";
import { orderAbandonQueue } from "@/lib/queue/orderAbandon.queue";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import {
  hasValidVerifiedCookie,
  setVerifiedCookieOnResponse,
} from "@/lib/cloudflare/verified-cookie";

export async function POST(request: NextRequest) {
  try {
    const { packId } = (await request.json()) as { packId?: string };

    if (!packId || typeof packId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing packId" },
        { status: 400 },
      );
    }

    // Auth is the gate for pack purchase
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          redirect: "/auth?callbackUrl=/packs",
        },
        { status: 401 },
      );
    }

    // ── 4. Validate pack exists ───────────────────────────────────────
    const pack = packById(packId);
    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Invalid pack" },
        { status: 400 },
      );
    }

    // ── 5. Now safe — touch Stripe, DB, queues ────────────────────────
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email!,
      session.user.name,
    );

    const order = await prisma.order.create({
      data: {
        type: "PACK",
        userId: session.user.id,
        packId: pack.id,
        packName: pack.name,
        amount: pack.price,
        status: "PENDING",
        customerName: session.user.name ?? null,
        customerEmail: session.user.email ?? null,
      },
    });

    await orderAbandonQueue.add(
      "abandon-check",
      { orderId: order.id },
      {
        delay: 30 * 60 * 1000,
        jobId: `abandon_${order.id}`,
      },
    );

    await auditService.logOrderCreated(order, {
      performedBy: session.user.id,
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customerId,
      customer_update: {
        shipping: "auto",
        address: "auto",
      },
      automatic_tax: { enabled: true },
      payment_intent_data: {
        setup_future_usage: "off_session",
      },
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.price,
            tax_behavior: "exclusive",
            product_data: {
              name: pack.name,
              description: pack.description,
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/packs/reveal/${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packs?canceled=true`,
      metadata: {
        orderId: order.id,
        userId: session.user.id,
        packId: pack.id,
      },
    });

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { success: false, error: "Checkout failed" },
      { status: 500 },
    );
  }
}
