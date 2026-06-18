// app/(public)/packs/page.tsx — server component, no "use client"

import { auth } from "@/lib/auth";
import PacksSelection from "./(components)/PacksSelection";
import { canUseMoneyLoop } from "@/lib/access/internal-allowlist";
import { MaintenanceNotice } from "@/components/wpulls/MaintenanceNotice";

export const metadata = {
  title: "Open Packs",
  description: "Choose your pack and reveal your card",
};

export default async function PacksPage() {
  const session = await auth();
  if (!canUseMoneyLoop(session?.user?.email)) {
    return <MaintenanceNotice />;
  }

  return <PacksSelection />;
}
