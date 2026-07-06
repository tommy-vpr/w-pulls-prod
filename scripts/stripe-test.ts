const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const account = await stripe.accounts.create({
      country: "US",
      email: "recipient-test@example.com",
      business_type: "individual",
      controller: {
        stripe_dashboard: { type: "none" },
        fees: { payer: "application" },
        losses: { payments: "stripe" },
        requirement_collection: "stripe",
      },
      capabilities: {
        transfers: { requested: true },
      },
      tos_acceptance: {
        service_agreement: "recipient",
      },
      metadata: { test: "recipient-config-check" },
    });

    console.log("id:", account.id);
    console.log("capabilities:", JSON.stringify(account.capabilities, null, 2));
    console.log("dashboard:", account.controller?.stripe_dashboard?.type);
    console.log(
      "service_agreement:",
      account.tos_acceptance?.service_agreement,
    );
    console.log(
      "currently_due:",
      JSON.stringify(account.requirements?.currently_due, null, 2),
    );

    const hasCard = "card_payments" in (account.capabilities || {});
    console.log(
      hasCard
        ? "❌ card_payments present — platform still forcing merchant capability"
        : "✅ NO card_payments — clean recipient/payout-only account",
    );
  } catch (err) {
    console.error("ERROR:", err.message);
  }
})();
