"use client";

import { useState, useRef, useMemo } from "react";
import {
  Loader2,
  Crown,
  Flame,
  Star,
  Gem,
  Zap,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { PackConfig } from "@/lib/packs/config";
import { cn } from "@/lib/utils";
import { TIER_ORDER } from "@/lib/packs/ev";
import { useRouter } from "next/navigation";

interface PackCardProps {
  pack: PackConfig;
  /** Turnstile verification token from page-level widget. null = not yet verified. */
  turnstileToken: string | null;
  /** Called when server rejects the token so the page can reset the widget */
  onTurnstileFailed?: () => void;
}

const packStyles: Record<
  string,
  {
    gradient: string;
    glowColor: string;
    icon: React.ReactNode;
    accentColor: string;
    borderColor: string;
  }
> = {
  silver: {
    gradient:
      "linear-gradient(135deg, rgba(203, 213, 225, 0.15) 0%, rgba(148, 163, 184, 0.25) 100%)",
    glowColor: "rgba(203, 213, 225, 0.35)",
    icon: <Zap className="h-8 w-8" />,
    accentColor: "#cbd5e1",
    borderColor: "rgba(203, 213, 225, 0.4)",
  },
  gold: {
    gradient:
      "linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(217, 119, 6, 0.3) 100%)",
    glowColor: "rgba(251, 191, 36, 0.4)",
    icon: <Flame className="h-8 w-8" />,
    accentColor: "#fbbf24",
    borderColor: "rgba(251, 191, 36, 0.45)",
  },
  platinum: {
    gradient:
      "linear-gradient(135deg, rgba(6,12,24,1) 0%, rgba(14,165,233,0.22) 45%, rgba(125,211,252,0.38) 100%)",
    glowColor: "rgba(56,189,248,0.48)",
    icon: <Sparkles className="h-8 w-8" />,
    accentColor: "#7dd3fc",
    borderColor: "rgba(125,211,252,0.42)",
  },
  diamond: {
    gradient:
      "linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(0, 200, 255, 0.35) 100%)",
    glowColor: "rgba(0, 255, 255, 0.3)",
    icon: <Gem className="h-8 w-8" />,
    accentColor: "#00ffff",
    borderColor: "rgba(0, 255, 255, 0.4)",
  },
  "black-label": {
    gradient:
      "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.3) 100%)",
    glowColor: "rgba(168, 85, 247, 0.4)",
    icon: <Crown className="h-8 w-8" />,
    accentColor: "#c084fc",
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
};

// Corner brackets component
function HoloBrackets({ color = "cyan-400" }: { color?: string }) {
  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4">
        <div
          className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-${color} to-transparent`}
          style={{
            background: `linear-gradient(to right, currentColor, transparent)`,
          }}
        />
        <div
          className={`absolute top-0 left-0 h-full w-px bg-gradient-to-b from-${color} to-transparent`}
          style={{
            background: `linear-gradient(to bottom, currentColor, transparent)`,
          }}
        />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4">
        <div
          className="absolute top-0 right-0 w-full h-px"
          style={{
            background: `linear-gradient(to left, currentColor, transparent)`,
          }}
        />
        <div
          className="absolute top-0 right-0 h-full w-px"
          style={{
            background: `linear-gradient(to bottom, currentColor, transparent)`,
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4">
        <div
          className="absolute bottom-0 left-0 w-full h-px"
          style={{
            background: `linear-gradient(to right, currentColor, transparent)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-full w-px"
          style={{
            background: `linear-gradient(to top, currentColor, transparent)`,
          }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4">
        <div
          className="absolute bottom-0 right-0 w-full h-px"
          style={{
            background: `linear-gradient(to left, currentColor, transparent)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-full w-px"
          style={{
            background: `linear-gradient(to top, currentColor, transparent)`,
          }}
        />
      </div>
    </>
  );
}

export function PackCard({
  pack,
  turnstileToken,
  onTurnstileFailed,
}: PackCardProps) {
  const [loading, setLoading] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const style = packStyles[pack.id] || packStyles.silver;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 12;
    const tiltY = (centerX - x) / 12;

    setTilt({ x: tiltX, y: tiltY });
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const handlePurchase = async () => {
    // ── Turnstile gate ─────────────────────────────────────────────
    if (!turnstileToken) {
      alert("Please complete verification below first.");
      // Scroll user toward the widget so they can find it
      document
        .getElementById("turnstile-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          turnstileToken,
        }),
      });

      const data = await res.json();

      // Auth redirect (existing behavior)
      if (res.status === 401 || data.redirect) {
        router.push(data.redirect || "/auth?callbackUrl=/packs");
        return;
      }

      // Turnstile rejected — reset page widget so user can re-verify
      if (res.status === 403 && /verif/i.test(data.error ?? "")) {
        onTurnstileFailed?.();
        alert("Verification expired. Please verify again to continue.");
        return;
      }

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Memoize glitter positions
  const glitterParticles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 1 + Math.random() * 2,
        delay: Math.random() * 2,
        size: 1 + Math.random() * 2,
      })),
    [],
  );

  const rarePlusChance = TIER_ORDER.filter(
    (t) => t !== "COMMON" && t !== "UNCOMMON",
  ).reduce((sum, t) => sum + (pack.odds[t] ?? 0), 0);

  const isVerified = !!turnstileToken;
  const buttonDisabled = loading; // Always clickable so we can show the prompt

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out flex-1",
          isHovering && "scale-[1.02]",
        )}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Outer glow */}
        <div
          className={cn(
            "absolute -inset-px rounded-xl transition-opacity duration-300",
            isHovering ? "opacity-100" : "opacity-50",
          )}
          style={{
            background: style.gradient,
            boxShadow: `0 0 30px ${style.glowColor}, 0 0 60px ${style.glowColor}`,
          }}
        />

        {/* Main card body */}
        <div
          className="relative rounded-xl border backdrop-blur-xl h-full"
          style={{
            background: `linear-gradient(135deg, rgba(3, 8, 18, 0.95), rgba(10, 15, 30, 0.98))`,
            borderColor: style.borderColor,
          }}
        >
          {/* Corner brackets */}
          <div
            className="absolute inset-2 pointer-events-none"
            style={{ color: style.accentColor }}
          >
            <HoloBrackets />
          </div>

          {/* Holographic shimmer overlay */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none",
              isHovering && "opacity-100",
            )}
            style={{
              background: `
      radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, 
        rgba(255, 255, 255, 0.15) 0%, 
        transparent 50%
      ),
      linear-gradient(
        105deg,
        transparent 20%,
        ${style.glowColor} 35%,
        rgba(255, 255, 255, 0) 50%,
        ${style.glowColor} 65%,
        transparent 80%
      )
    `,
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
            }}
          />

          {/* Glitter particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {glitterParticles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "absolute rounded-full transition-opacity duration-500",
                  isHovering ? "opacity-100" : "opacity-0",
                )}
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.size,
                  height: p.size,
                  background: style.accentColor,
                  boxShadow: `0 0 ${p.size * 2}px ${style.accentColor}`,
                  animation: `twinkle ${p.duration}s ease-in-out infinite`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative p-6 flex flex-col items-center text-center h-full">
            {/* Top Badge */}
            <div
              className="mt-6 lg:mt-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{
                background: `linear-gradient(135deg, ${style.accentColor}20, ${style.accentColor}10)`,
                border: `1px solid ${style.accentColor}40`,
                color: style.accentColor,
                boxShadow: `0 0 10px ${style.accentColor}30`,
              }}
            >
              {pack.id === "black-label" && <Crown className="w-3 h-3" />}
              {pack.id.toUpperCase().replace("-", " ")}
            </div>

            {/* Icon */}
            <div
              className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: style.gradient,
                border: `1px solid ${style.borderColor}`,
                boxShadow: `0 0 20px ${style.glowColor}, inset 0 0 20px ${style.glowColor}`,
                color: style.accentColor,
              }}
            >
              {style.icon}
              <div
                className="absolute -inset-2 rounded-xl blur-xl -z-10 opacity-50"
                style={{ background: style.glowColor }}
              />
            </div>

            {/* Pack Name */}
            <h3
              className="text-xl font-bold mb-2 tracking-wide"
              style={{ color: style.accentColor }}
            >
              {pack.name}
            </h3>

            {/* Price */}
            <div className="text-3xl font-black text-white mb-3 tracking-tight">
              {pack.displayPrice}
            </div>

            {/* Odds Bar */}
            <div className="w-full mt-auto">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                <span>Rare+ Chance</span>
                <span style={{ color: style.accentColor }}>
                  {rarePlusChance.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rarePlusChance}%`,
                    background: `linear-gradient(90deg, ${style.accentColor}, ${style.glowColor})`,
                    boxShadow: `0 0 10px ${style.glowColor}`,
                  }}
                />
              </div>
            </div>

            {/* Bottom decorative line */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${style.accentColor}50, transparent)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={buttonDisabled}
        onMouseEnter={() => setButtonHover(true)}
        onMouseLeave={() => setButtonHover(false)}
        className={cn(
          "cursor-pointer relative w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300",
          "border backdrop-blur-sm",
          buttonHover && "scale-[1.02]",
          loading && "opacity-50 cursor-not-allowed",
          !isVerified && "opacity-70",
        )}
        style={{
          background: `linear-gradient(135deg, ${style.accentColor}20, ${style.accentColor}10)`,
          borderColor: buttonHover
            ? `${style.accentColor}60`
            : `${style.accentColor}40`,
          color: style.accentColor,
          boxShadow: buttonHover ? `0 0 25px ${style.glowColor}` : "none",
        }}
        title={
          !isVerified ? "Complete verification below to enable" : undefined
        }
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : !isVerified ? (
          <span className="flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Verify to Purchase
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Purchase
          </span>
        )}
      </button>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
