"use client";

// components/consent/ConsentProvider.tsx
// Holds the current consent decision, persists it, and mirrors it into
// Google Consent Mode so GTM holds/releases tags accordingly.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ConsentState,
  grantAllState,
  defaultDeniedState,
  readConsentCookie,
  writeConsentCookie,
} from "@/lib/consent/consent";

interface ConsentContextValue {
  /** Current decision, or null if the user hasn't chosen yet. */
  consent: ConsentState | null;
  /** True until we've read the cookie on mount (avoids a flash). */
  ready: boolean;
  /** Whether the banner/preferences UI should be open. */
  isOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  /** Persist a decision and update Consent Mode. */
  save: (analyticsGranted: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag?: (...args: any[]) => void;
  }
}

// Push a Consent Mode "update" using the native gtag command, so Google tags
// gate themselves directly — no extra GTM trigger/tag translation needed.
// Falls back to pushing the command array straight onto dataLayer if the
// gtag shim isn't present yet.
function pushConsentUpdate(analyticsGranted: boolean) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];

  const value = analyticsGranted ? "granted" : "denied";
  const consentParams = {
    analytics_storage: value,
    ad_storage: "denied", // no marketing category yet
    ad_user_data: "denied",
    ad_personalization: "denied",
  };

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", consentParams);
  } else {
    // gtag() ultimately just pushes its arguments onto dataLayer; replicate
    // that shape so Consent Mode still receives the update if the shim from
    // ConsentModeScript hasn't attached window.gtag yet.
    window.dataLayer.push([
      "consent",
      "update",
      consentParams,
    ] as unknown as Record<string, unknown>);
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // On mount: read the stored decision. If none, open the banner.
  useEffect(() => {
    const stored = readConsentCookie();
    setConsent(stored);
    setReady(true);
    if (!stored) {
      setIsOpen(true);
    } else {
      // Re-assert the stored decision into Consent Mode on every load.
      pushConsentUpdate(stored.analytics);
    }
  }, []);

  const persist = useCallback((next: ConsentState) => {
    writeConsentCookie(next);
    setConsent(next);
    pushConsentUpdate(next.analytics);
    setIsOpen(false);
  }, []);

  const save = useCallback(
    (analyticsGranted: boolean) => {
      persist({
        ...defaultDeniedState(),
        analytics: analyticsGranted,
      });
    },
    [persist],
  );

  const acceptAll = useCallback(() => persist(grantAllState()), [persist]);
  const rejectAll = useCallback(() => persist(defaultDeniedState()), [persist]);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        ready,
        isOpen,
        openPreferences: () => setIsOpen(true),
        closePreferences: () => setIsOpen(false),
        save,
        acceptAll,
        rejectAll,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
