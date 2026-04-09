"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import {
  verifyEmailAction,
  resendVerificationAction,
} from "@/lib/actions/auth.actions";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Verify email",
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    const pin = newDigits.join("");
    if (pin.length === 6) {
      handleVerify(pin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);

      // Focus the next empty or last input
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();

      if (pasted.length === 6) {
        handleVerify(pasted);
      }
    }
  };

  const handleVerify = async (pin: string) => {
    if (isVerifying || !email) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyEmailAction(email, pin);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth?message=email_verified");
        }, 2000);
      } else {
        setError(result.error ?? "Verification failed");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setResendMessage(null);
    setError(null);

    try {
      const result = await resendVerificationAction(email);
      if (result.error) {
        setError(result.error);
      } else {
        setResendMessage("New code sent! Check your inbox.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden
                    bg-gradient-to-br from-black via-slate-950 to-neutral-900"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-900/40 rounded-full mix-blend-screen blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-900/40 rounded-full mix-blend-screen blur-3xl opacity-25 animate-blob animation-delay-2000" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-3xl p-8 shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/logo.png"
              width={100}
              height={50}
              alt="WPulls"
              className="invert"
            />
          </div>

          {success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Email verified!
              </h1>
              <p className="text-white/60 text-sm">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            /* PIN Entry State */
            <>
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-cyan-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Enter verification code
                </h1>
                <p className="text-white/50 text-sm">
                  We sent a 6-digit code to
                </p>
                {email && (
                  <p className="text-white font-medium text-sm mt-1">{email}</p>
                )}
              </div>

              {/* PIN Input */}
              <div className="flex gap-2.5 justify-center mb-6">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isVerifying}
                    className={`
                      w-12 h-14 text-center text-xl font-bold rounded-xl
                      bg-white/5 border-2 transition-all duration-200
                      text-white outline-none
                      disabled:opacity-50
                      ${
                        error
                          ? "border-red-500/50 focus:border-red-400"
                          : digit
                            ? "border-cyan-500/50"
                            : "border-white/10 focus:border-cyan-400"
                      }
                    `}
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {isVerifying && (
                <div className="flex items-center justify-center gap-2 mb-4 text-cyan-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Resend success */}
              {resendMessage && (
                <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {resendMessage}
                </div>
              )}

              {/* Resend */}
              <div className="text-center mb-4">
                <p className="text-white/40 text-sm">
                  Didn&apos;t get the code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend"}
                  </button>
                </p>
              </div>

              {/* Back to login */}
              <Link
                href="/auth"
                className="flex items-center justify-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
