// components/wpulls/NewsletterSignup.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface NewsletterSignupProps {
  heading?: string;
  description?: string;
  /** Klaviyo account id — used to build the onsite script URL. */
  klaviyoCompanyId?: string;
  /** Class of the Klaviyo embed target. Klaviyo finds it by class name. */
  formClassName?: string;
  /** Extra classes on the outer wrapper, for spacing in whatever section it sits in. */
  className?: string;
  /** How long to keep the spinner up before giving up, in ms. */
  fallbackTimeoutMs?: number;
}

export function NewsletterSignup({
  heading = "Stay updated",
  description = "New drops, restocks, and pack releases — straight to your inbox.",
  klaviyoCompanyId = "TqGyCz",
  formClassName = "klaviyo-form-X2JQrP",
  className = "",
  fallbackTimeoutMs = 10000,
}: NewsletterSignupProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [formLoaded, setFormLoaded] = useState(false);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    // Klaviyo may have injected the form before this effect ran.
    if (el.childElementCount > 0) {
      setFormLoaded(true);
      return;
    }

    // Watch the embed div — Klaviyo injects the form as child node(s).
    const observer = new MutationObserver(() => {
      if (el.childElementCount > 0) {
        setFormLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true, subtree: true });

    // Don't spin forever if the form is unpublished or the script is blocked.
    const timeout = setTimeout(() => {
      setFormLoaded(true);
      observer.disconnect();
    }, fallbackTimeoutMs);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [fallbackTimeoutMs]);

  return (
    <section className={className}>
      {/* Stable id — next/script dedupes, so this is safe if the component
          appears more than once (e.g. footer + a homepage section). */}
      <Script
        id="klaviyo-onsite"
        strategy="afterInteractive"
        src={`https://static.klaviyo.com/onsite/js/${klaviyoCompanyId}/klaviyo.js?company_id=${klaviyoCompanyId}`}
      />

      <div className="mx-auto w-full max-w-md text-center">
        <div className="relative mt-5 min-h-[80px]">
          {!formLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500 motion-reduce:animate-none"
                role="status"
                aria-label="Loading form"
              />
            </div>
          )}

          {/* Klaviyo embed mount point */}
          <div ref={formRef} className={formClassName} />
        </div>
      </div>
    </section>
  );
}
