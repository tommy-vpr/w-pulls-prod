// app/api/wallet/deposit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

const ALLOWED_AMOUNTS = [1000, 5000, 10000, 50000]; // $10, $50, $100, $500 in cents

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { amount } = await request.json();

    if (!amount || !ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { success: false, error: "Invalid deposit amount" },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `Wallet Deposit — $${(amount / 100).toFixed(2)}`,
              description: "Add funds to your W-Pull wallet",
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?deposit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?deposit=canceled`,
      metadata: {
        type: "wallet_deposit",
        userId: session.user.id,
        depositAmount: amount.toString(),
      },
    });

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (err: any) {
    console.error("Deposit checkout error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create deposit session" },
      { status: 500 },
    );
  }
}
