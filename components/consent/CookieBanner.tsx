"use client";

// components/consent/CookieBanner.tsx
// Passive bottom bar (no overlay, non-blocking). Users can keep browsing.
// Nothing non-essential loads until a choice is made (Consent Mode gates
// the actual tags).

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, ShieldCheck, BarChart3, X } from "lucide-react";
import Link from "next/link";
import { useConsent } from "./ConsentProvider";

export function CookieBanner() {
  const {
    consent,
    ready,
    isOpen,
    closePreferences,
    acceptAll,
    rejectAll,
    save,
  } = useConsent();

  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnalytics(consent?.analytics ?? false);
      setShowDetails(Boolean(consent));
    }
  }, [isOpen, consent]);

  if (!ready || !isOpen) return null;

  // Re-open (from footer) is dismissible; the first-run bar is passive too.
  const dismissible = Boolean(consent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
        role="region"
        aria-label="Cookie preferences"
      >
        <div
          className="relative mx-auto w-full max-w-4xl rounded-2xl border border-violet-400 bg-linear-to-br from-violet-800 to-violet-700 p-5 shadow-2xl backdrop-blur-sm sm:p-6"
          style={{ boxShadow: "0 0 40px rgba(0,255,255,0.08)" }}
        >
          {dismissible && (
            <button
              type="button"
              onClick={closePreferences}
              className="absolute right-3 top-3 text-gray-500 transition hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Copy */}
            <div className="flex items-start gap-3">
              <p className="text-sm leading-relaxed text-gray-300">
                We use cookies to keep W-Pulls working and, with your
                permission, to understand how the site is used.{" "}
                <Link
                  href="/privacy-policy"
                  className="text-white underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Actions */}
            {!showDetails && (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="order-3 cursor-pointer rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:text-gray-200 sm:order-1"
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="order-2 cursor-pointer rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="order-1 cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-300 sm:order-3"
                >
                  Accept all
                </button>
              </div>
            )}
          </div>

          {/* Category detail (customize view) */}
          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 border-t border-violet-500 pt-4">
                  {/* Essential - locked on */}
                  <div className="flex items-start justify-between gap-4 rounded-xl bg-violet-600 p-3">
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          Essential
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white">
                          Required for sign-in, your cart, and security checks.
                          These can't be turned off.
                        </p>
                      </div>
                    </div>
                    <span className="mt-1 shrink-0 rounded-full bg-violet-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                      Always on
                    </span>
                  </div>

                  {/* Analytics - toggleable */}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-violet-600 p-3">
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          Analytics
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-white">
                          Helps us see which pages and packs people use. Nothing
                          loads until you allow it.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={analytics}
                      aria-label="Allow analytics cookies"
                      onClick={() => setAnalytics((v) => !v)}
                      className={`cursor-pointer relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors bg-violet-800`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          analytics ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="cursor-pointer order-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:order-1"
                    >
                      Accept all
                    </button>
                    <button
                      type="button"
                      onClick={() => save(analytics)}
                      className="cursor-pointer order-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-300 sm:order-2"
                    >
                      Save preferences
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
