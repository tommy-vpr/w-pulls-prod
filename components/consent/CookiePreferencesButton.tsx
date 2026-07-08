"use client";

// components/consent/CookiePreferencesButton.tsx
// Drop anywhere (e.g. the footer) to let users reopen and change their
// cookie choices. GDPR: withdrawing consent must be as easy as giving it.

import { useConsent } from "./ConsentProvider";

export function CookiePreferencesButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={
        className ??
        "text-sm text-zinc-400 transition-colors hover:text-cyan-400"
      }
    >
      Cookie preferences
    </button>
  );
}
