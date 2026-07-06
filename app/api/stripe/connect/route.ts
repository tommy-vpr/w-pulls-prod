// app/api/stripe/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

// POST /api/stripe/connect - Create or get onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Helper: create a fresh recipient-only connected account.
    // Payout-only model (Stripe-managed, no dashboard):
    // - service_agreement "recipient" → receives transfers, never processes charges
    // - requirement_collection "stripe" + dashboard "none" → Stripe collects info
    //   AND must own losses (negative balances/refunds/chargebacks), so
    //   losses.payments MUST be "stripe" — "application" is rejected in this combo.
    const createRecipientAccount = async () => {
      const account = await stripe.accounts.create({
        country: "US",
        email: user.email,
        business_type: "individual",

        controller: {
          stripe_dashboard: { type: "none" },
          fees: { payer: "application" },
          losses: { payments: "stripe" },
          requirement_collection: "stripe",
        },

        capabilities: {
          card_payments: { requested: false },
          transfers: { requested: true },
        },

        // Remove tos_acceptance entirely for US → US

        metadata: { userId: user.id },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectedAccountId: account.id },
      });

      return account;
    };
    let accountId = user.stripeConnectedAccountId;
    let account;

    if (!accountId) {
      // No account yet — create one.
      account = await createRecipientAccount();
      accountId = account.id;
    } else {
      // Account exists — retrieve it, but self-heal if the stored ID is stale
      // (e.g. created under a different Stripe account/mode).
      try {
        account = await stripe.accounts.retrieve(accountId);
      } catch (err: any) {
        if (
          err?.code === "account_invalid" ||
          err?.code === "resource_missing"
        ) {
          account = await createRecipientAccount();
          accountId = account.id;
        } else {
          throw err;
        }
      }
    }

    // Check if already fully onboarded
    if (account.details_submitted && account.payouts_enabled) {
      if (!user.stripeConnectOnboardedAt) {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeConnectOnboardedAt: new Date() },
        });
      }

      return NextResponse.json({
        success: true,
        alreadyOnboarded: true,
        message: "Your payout account is already set up!",
      });
    }

    // Create onboarding link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("[Stripe Connect] NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { success: false, error: "Server misconfigured" },
        { status: 500 },
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/wallet?connect=refresh`,
      return_url: `${appUrl}/dashboard/wallet?connect=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);

    if (
      error.type === "StripeInvalidRequestError" &&
      error.message?.includes("signed up for Connect")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Stripe Connect is not enabled for this account. Please contact support.",
          code: "CONNECT_NOT_ENABLED",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create onboarding link",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/stripe/connect - Disconnect/reset connected account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Clear the connected account from user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeConnectedAccountId: null,
        stripeConnectOnboardedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payout account disconnected. You can connect a new one.",
    });
  } catch (error: any) {
    console.error("Stripe disconnect error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect" },
      { status: 500 },
    );
  }
}

// GET /api/stripe/connect - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeConnectedAccountId: true,
        stripeConnectOnboardedAt: true,
      },
    });

    if (!user?.stripeConnectedAccountId) {
      return NextResponse.json({
        success: true,
        status: "not_started",
        hasAccount: false,
        isOnboarded: false,
        payoutsEnabled: false,
      });
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(
      user.stripeConnectedAccountId,
    );

    const isOnboarded = account.details_submitted && account.payouts_enabled;

    // Update onboarded timestamp if newly completed
    if (isOnboarded && !user.stripeConnectOnboardedAt) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectOnboardedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      status: isOnboarded ? "complete" : "incomplete",
      hasAccount: true,
      isOnboarded,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements?.currently_due ?? [],
    });
  } catch (error: any) {
    console.error("Stripe Connect status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check status" },
      { status: 500 },
    );
  }
}
