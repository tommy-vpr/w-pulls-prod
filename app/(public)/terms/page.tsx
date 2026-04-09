export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for W-Pulls card system",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#030812] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1
            className="font-orbitron text-3xl md:text-4xl font-bold text-cyan-400 mb-3"
            style={{ textShadow: "0 0 20px rgba(0,255,255,0.4)" }}
          >
            Terms of Service
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              1. Acceptance of Terms
            </h2>
            <p className="text-zinc-400 text-sm">
              By accessing or using W-Pulls, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service. We reserve the right to update these terms at
              any time, and continued use of the platform constitutes acceptance
              of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              2. Eligibility
            </h2>
            <p className="text-zinc-400 text-sm">
              You must be at least 18 years old to use W-Pulls. By using the
              platform, you represent and warrant that you meet this age
              requirement and that you have the legal capacity to enter into a
              binding agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              3. Pack Purchases & Payments
            </h2>
            <p className="text-zinc-400 text-sm">
              All pack purchases are final. When you purchase a pack, you are
              paying for a randomized card pull based on published probability
              rates. Results are determined at the time of purchase and cannot
              be reversed. Payments are processed securely through Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              4. Buyback & Wallet
            </h2>
            <p className="text-zinc-400 text-sm">
              Buyback offers are optional and time-limited. Once accepted,
              buybacks are final and the card value is credited to your wallet.
              Wallet funds are subject to a hold period before they become
              withdrawable. W-Pulls reserves the right to adjust hold periods to
              prevent fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              5. Withdrawals
            </h2>
            <p className="text-zinc-400 text-sm">
              Withdrawals require a connected Stripe account. Minimum withdrawal
              amount is $10.00. W-Pulls is not responsible for delays caused by
              third-party payment processors. We reserve the right to delay or
              deny withdrawals if fraud or abuse is suspected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              6. Prohibited Conduct
            </h2>
            <p className="text-zinc-400 text-sm">
              You agree not to use W-Pulls for any unlawful purpose, attempt to
              manipulate pack outcomes, use bots or automated tools, resell
              access to the platform, or engage in any activity that disrupts or
              damages our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              7. Limitation of Liability
            </h2>
            <p className="text-zinc-400 text-sm">
              W-Pulls is provided "as is" without warranties of any kind. We are
              not liable for any indirect, incidental, or consequential damages
              arising from your use of the platform. Our total liability shall
              not exceed the amount you paid in the 30 days prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              8. Contact
            </h2>
            <p className="text-zinc-400 text-sm">
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:support@wpulls.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                support@wpulls.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
