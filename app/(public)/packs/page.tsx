// app/(public)/packs/page.tsx — server component, no "use client"

import PacksSelection from "./(components)/PacksSelection";

export const metadata = {
  title: "Open Packs",
  description: "Choose your pack and reveal your card",
};

export default function PacksPage() {
  return <PacksSelection />;
}
