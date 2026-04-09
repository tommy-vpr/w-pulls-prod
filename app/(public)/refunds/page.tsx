export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refund Policy",
  description: "Refund policy for W-Pulls card system",
};

export default function RefundsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1
            className="font-orbitron text-3xl md:text-4xl font-bold text-cyan-400 mb-3"
            style={{ textShadow: "0 0 20px rgba(0,255,255,0.4)" }}
          >
            Refund Policy
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Notice banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-amber-400 text-sm font-mono">
              ⚠ All pack purchases are final. Please read this policy carefully
              before purchasing.
            </p>
          </div>

          <div className="space-y-8 text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
                No Refunds on Pack Purchases
              </h2>
              <p className="text-zinc-400 text-sm">
                Due to the digital and randomized nature of pack pulls, all
                purchases are final and non-refundable. Once a pack has been
                purchased and the card has been revealed, we are unable to issue
                refunds. This policy exists because the outcome is determined at
                the time of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
                Buyback Option
              </h2>
              <p className="text-zinc-400 text-sm">
                Instead of a refund, W-Pulls offers a buyback system. After
                revealing your card, you have a limited time window to sell it
                back to us for a percentage of its value. The buyback amount is
                credited to your wallet and can be withdrawn once the hold
                period clears.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
                Technical Issues
              </h2>
              <p className="text-zinc-400 text-sm">
                If you experience a technical issue that prevents you from
                accessing your purchased pack or card, please contact support
                immediately at{" "}
                <a
                  href="mailto:support@wpulls.com"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  support@wpulls.com
                </a>
                . We will investigate and resolve legitimate technical issues on
                a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
                Unauthorized Charges
              </h2>
              <p className="text-zinc-400 text-sm">
                If you believe your account was used without your authorization,
                contact us immediately. We take fraud seriously and will work
                with you and your payment provider to resolve unauthorized
                charges.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
                Contact Us
              </h2>
              <p className="text-zinc-400 text-sm">
                For refund-related inquiries, contact{" "}
                <a
                  href="mailto:support@wpulls.com"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  support@wpulls.com
                </a>
                . Please include your order ID and account email in your
                message.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
