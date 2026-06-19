"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const formRef = useRef<HTMLDivElement>(null);
  const [formLoaded, setFormLoaded] = useState(false);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    // If Klaviyo already injected the form before this ran, mark loaded.
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

    // Safety timeout — stop spinning after 10s even if nothing rendered,
    // so the user isn't stuck on a spinner forever (e.g. form unpublished).
    const timeout = setTimeout(() => {
      setFormLoaded(true);
      observer.disconnect();
    }, 10000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <Script
        id="klaviyo-onsite"
        strategy="afterInteractive"
        src="https://static.klaviyo.com/onsite/js/TqGyCz/klaviyo.js?company_id=TqGyCz"
      />

      <div className="h-screen flex justify-center flex-col items-center gap-4 px-6">
        <Image
          src="/images/w-pull-logo.png"
          width={100}
          height={100}
          alt="W-Pulls"
        />

        <h3 className="text-3xl text-cyan-500 font-semibold tracking-wide">
          W-Pulls
        </h3>

        <div className="relative w-full max-w-md min-h-[80px]">
          {/* Spinner — shown until Klaviyo injects the form */}
          {!formLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
                role="status"
                aria-label="Loading form"
              />
            </div>
          )}

          {/* Klaviyo embed mount point */}
          <div ref={formRef} className="klaviyo-form-X2JQrP" />
        </div>
      </div>
    </>
  );
}
