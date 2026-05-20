// components/turnstile-widget.tsx
"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  /** Called when challenge passes — token expires in ~5 min */
  onSuccess: (token: string) => void;
  /** Called when token expires; widget will auto-reset */
  onExpire?: () => void;
  /** Called on widget error */
  onError?: () => void;
  /** Reset trigger — increment this to force a fresh challenge */
  resetKey?: number;
  theme?: "light" | "dark" | "auto";
  /** "always" (visible) or "interaction-only" (managed) */
  appearance?: "always" | "interaction-only" | "execute";
}

export function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  resetKey,
  theme = "dark",
  appearance = "always",
}: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Reset widget when parent bumps resetKey (e.g. after failed verification)
  useEffect(() => {
    if (resetKey !== undefined) {
      ref.current?.reset();
    }
  }, [resetKey]);

  if (!siteKey) {
    console.error("[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set");
    return (
      <div className="text-xs text-rose-400 font-mono">
        Verification unavailable — site key missing
      </div>
    );
  }

  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      onSuccess={onSuccess}
      onExpire={() => {
        onExpire?.();
      }}
      onError={() => {
        onError?.();
      }}
      options={{
        theme,
        appearance,
      }}
    />
  );
}
