export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for W-Pulls card system",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1
            className="font-orbitron text-3xl md:text-4xl font-bold text-cyan-400 mb-3"
            style={{ textShadow: "0 0 20px rgba(0,255,255,0.4)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              1. Information We Collect
            </h2>
            <p className="text-zinc-400 text-sm">
              We collect information you provide directly, including your name,
              email address, and payment information when you register or make a
              purchase. We also collect usage data such as pages visited,
              actions taken, and device information to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              2. How We Use Your Information
            </h2>
            <p className="text-zinc-400 text-sm">
              We use your information to process transactions, maintain your
              account, send transactional emails, prevent fraud, and improve the
              W-Pulls platform. We do not sell your personal data to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              3. Payment Information
            </h2>
            <p className="text-zinc-400 text-sm">
              Payment processing is handled by Stripe. W-Pulls does not store
              your full credit card details. Stripe's privacy policy governs the
              handling of your payment information. We store only transaction
              references and amounts necessary for order management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              4. Cookies
            </h2>
            <p className="text-zinc-400 text-sm">
              We use cookies and similar technologies to maintain your session,
              remember preferences, and analyze usage patterns. You can control
              cookie settings through your browser, though disabling cookies may
              affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              5. Data Retention
            </h2>
            <p className="text-zinc-400 text-sm">
              We retain your account data for as long as your account is active
              or as needed to provide services. You may request deletion of your
              account and associated data at any time through the Settings page
              or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              6. Third-Party Services
            </h2>
            <p className="text-zinc-400 text-sm">
              We use third-party services including Stripe (payments), Google
              (authentication), Resend (email), and Google Cloud Storage
              (images). Each service has its own privacy policy governing data
              they collect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              7. Your Rights
            </h2>
            <p className="text-zinc-400 text-sm">
              You have the right to access, correct, or delete your personal
              data. To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@wpulls.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                privacy@wpulls.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3 font-mono uppercase tracking-wider">
              8. Contact
            </h2>
            <p className="text-zinc-400 text-sm">
              For privacy-related questions, contact us at{" "}
              <a
                href="mailto:privacy@wpulls.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                privacy@wpulls.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
