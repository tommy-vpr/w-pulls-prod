"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Menu,
  X,
  Home,
  Package,
  ShoppingBag,
  LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils/initials";
import { CartIcon } from "./CartIcon";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Packs", href: "/packs", icon: Package },
  { label: "Shop", href: "/store", icon: ShoppingBag },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth" }); // ← fix redirectTo to callbackUrl
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 font-mono">
        <div
          className={`
            relative mx-3 mt-3 rounded-xl transition-all duration-500
            border border-cyan-400/20 backdrop-blur-xl
            ${
              scrolled
                ? "bg-slate-950/90 shadow-[0_0_30px_rgba(0,255,255,0.1),0_10px_40px_rgba(0,0,0,0.5)]"
                : "bg-slate-950/60 shadow-[0_0_20px_rgba(0,255,255,0.05)]"
            }
          `}
        >
          <nav className="relative flex h-14 items-center justify-between px-5">
            {/* Logo */}
            <Link href="/" className="group relative flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                  <Image
                    src={"/images/w-pull-logo.png"}
                    width={32}
                    height={32}
                    alt="W-Pulls"
                  />
                </div>
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/20 blur-md -z-10 opacity-60" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-white tracking-widest">
                  W-Pulls
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-400/50 -mt-0.5">
                  Card System
                </span>
              </div>
            </Link>

            {/* Center Nav — desktop only */}
            <div
              className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center"
              onMouseLeave={() => setActive(null)}
            >
              {NAV.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setActive(item.href)}
                >
                  {active === item.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400/15 to-fuchsia-500/10 border border-cyan-400/25 shadow-[0_0_15px_rgba(0,255,255,0.2),inset_0_0_15px_rgba(0,255,255,0.05)]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Link
                    href={item.href}
                    className="relative z-10 block rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-wider text-cyan-100/70 transition-all duration-300 hover:text-cyan-300"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-3">
              <CartIcon />

              {/* Desktop user menu */}
              {status === "loading" ? (
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-fuchsia-500/10 border border-cyan-400/20 animate-pulse" />
              ) : session?.user ? (
                <div ref={menuRef} className="relative hidden md:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`
                      cursor-pointer flex items-center gap-2 rounded-lg p-1.5 pr-3
                      bg-gradient-to-br from-cyan-400/10 to-fuchsia-500/5
                      border border-cyan-400/20 transition-all duration-300
                      hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]
                      ${userMenuOpen ? "shadow-[0_0_20px_rgba(0,255,255,0.2)] border-cyan-400/40" : ""}
                    `}
                  >
                    {status === "authenticated" && session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Avatar"}
                        className="h-7 w-7 rounded-md object-cover ring-1 ring-cyan-400/30"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30">
                        {getInitials(session.user)}
                      </div>
                    )}
                    <span className="text-xs text-cyan-100/80 hidden sm:block">
                      {session.user.name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-cyan-400/60 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden bg-slate-950/95 border border-cyan-400/20 shadow-[0_0_30px_rgba(0,255,255,0.1),0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      >
                        <div className="px-4 py-3 border-b border-cyan-400/10 bg-gradient-to-r from-cyan-400/5 to-transparent">
                          <p className="text-sm font-semibold text-white truncate">
                            {session.user.name || "User"}
                          </p>
                          <p className="text-[10px] font-mono text-cyan-400/50 truncate">
                            {session.user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          {[
                            {
                              href: "/dashboard",
                              icon: Zap,
                              label: "Dashboard",
                            },
                            {
                              href: "/dashboard/profile",
                              icon: User,
                              label: "Profile",
                            },
                            {
                              href: "/dashboard/settings",
                              icon: Settings,
                              label: "Settings",
                            },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-cyan-100/70 hover:text-cyan-300 hover:bg-cyan-400/5 transition-all duration-300 group"
                            >
                              <item.icon className="h-4 w-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
                              {item.label}
                              <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-red-400/10 py-1">
                          <button
                            onClick={handleSignOut}
                            className="cursor-pointer flex w-full items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
                          >
                            <LogOut className="h-4 w-4 text-rose-400/50 group-hover:text-rose-400 transition-colors" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/auth"
                    className="px-4 py-2 text-xs uppercase tracking-wider text-cyan-100/70 hover:text-cyan-300 transition-all duration-300"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth"
                    className="relative px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded-lg bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.3)] hover:border-cyan-400/50 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-cyan-100/70 hover:text-cyan-300 hover:bg-cyan-400/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-[6px] bg-cyan-400/50 blur-md" />
        </div>
      </header>

      {/* ─── Mobile Drawer ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-[80vw] max-w-sm flex flex-col bg-slate-950/98 border-l border-cyan-400/20 backdrop-blur-xl md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle glow edge */}
              <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-cyan-500/50 via-fuchsia-500/50 to-cyan-500/50" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/20">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30">
                    <Image
                      src={"/images/w-pull-logo.png"}
                      width={24}
                      height={24}
                      alt="W-Pulls"
                    />
                  </div>
                  <span className="font-bold text-sm text-white tracking-widest font-mono">
                    W-Pulls
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-cyan-100/50 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info (if logged in) */}
              {session?.user && (
                <div className="flex items-center gap-3 px-5 py-4 border-b border-cyan-400/10 bg-gradient-to-r from-cyan-400/5 to-transparent">
                  {status === "authenticated" && session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Avatar"}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-cyan-400/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30">
                      {getInitials(session.user)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate font-mono">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-[10px] text-cyan-400/50 truncate font-mono">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {/* Main nav */}
                <p className="px-3 mb-2 text-[9px] uppercase tracking-[0.2em] text-cyan-400/40 font-mono">
                  Navigation
                </p>
                {NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-mono uppercase tracking-wider transition-all duration-300
                        ${
                          isActive
                            ? "text-cyan-300 bg-gradient-to-r from-cyan-400/15 to-fuchsia-500/10 border border-cyan-400/25"
                            : "text-cyan-100/60 hover:text-cyan-300 hover:bg-cyan-400/5"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500" />
                      )}
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-cyan-400/40"}`}
                      />
                      {item.label}
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </Link>
                  );
                })}

                {/* Dashboard links (logged in) */}
                {session?.user && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-cyan-400/40 font-mono">
                        Account
                      </p>
                    </div>
                    {[
                      { href: "/dashboard", icon: Zap, label: "Dashboard" },
                      {
                        href: "/dashboard/profile",
                        icon: User,
                        label: "Profile",
                      },
                      {
                        href: "/dashboard/settings",
                        icon: Settings,
                        label: "Settings",
                      },
                    ].map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-mono uppercase tracking-wider transition-all duration-300
                            ${
                              isActive
                                ? "text-cyan-300 bg-gradient-to-r from-cyan-400/15 to-fuchsia-500/10 border border-cyan-400/25"
                                : "text-cyan-100/60 hover:text-cyan-300 hover:bg-cyan-400/5"
                            }
                          `}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500" />
                          )}
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-cyan-400/40"}`}
                          />
                          {item.label}
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer — sign out or sign in */}
              <div className="border-t border-cyan-400/10 p-4">
                {session?.user ? (
                  <button
                    onClick={handleSignOut}
                    className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-mono uppercase tracking-wider text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300 group"
                  >
                    <LogOut className="h-4 w-4 text-rose-400/50 group-hover:text-rose-400 transition-colors" />
                    Sign out
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-3 text-sm font-mono uppercase tracking-wider text-cyan-100/70 hover:text-cyan-300 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/5 transition-all"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-3 text-sm font-semibold font-mono uppercase tracking-wider text-white rounded-lg bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.3)] transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
