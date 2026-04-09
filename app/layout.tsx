import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SessionProvider } from "@/components/providers/session-provider";
import { Orbitron, Rajdhani } from "next/font/google";
import { GTMNoScript, GTMScript } from "@/components/analytics/GTM";

const inter = Inter({ subsets: ["latin"] });

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "WPulls",
    template: "%s | WPulls",
  },
  description: "W every pull",
  icons: {
    icon: "/images/w-pull-logo.png", // 32x32 or 48x48
    shortcut: "/images/w-pull-logo.png", // optional alias
    apple: "/images/w-pull-logo.png", // for iOS home screen
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GTMScript />
      </head>
      <body
        className={`${inter.className} ${orbitron.variable} ${rajdhani.variable} bg-[#0a0a0f]`}
      >
        <GTMNoScript />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
