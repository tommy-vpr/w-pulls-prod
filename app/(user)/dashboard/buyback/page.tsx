import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  isWithinSellbackWindow,
  getSellbackDeadline,
  getBuybackRate,
  calculateBuybackAmount,
} from "@/lib/buyback/config";
import { BuybackList } from "./BuybackList";

export const metadata = { title: "Sell Back" };
export const dynamic = "force-dynamic"; // time-sensitive; never cache

export default async function BuybackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?callbackUrl=/dashboard/buyback");

  const items = await prisma.orderItem.findMany({
    where: {
      disposition: "KEPT",
      order: {
        userId: session.user.id,
        status: "COMPLETED",
        type: "PACK",
        revealedAt: { not: null },
      },
    },
    include: {
      order: { select: { revealedAt: true, selectedTier: true } },
      product: {
        select: { id: true, title: true, imageUrl: true, price: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Keep only items still inside the fixed reveal+10min window, and serialize.
  const eligible = items
    .filter((it) => isWithinSellbackWindow(it.order.revealedAt))
    .map((it) => {
      const tier = it.order.selectedTier!;
      const priceCents = Math.round(Number(it.product.price) * 100);
      return {
        orderItemId: it.id,
        productId: it.product.id,
        title: it.product.title,
        imageUrl: it.product.imageUrl,
        productValue: priceCents,
        buybackRate: getBuybackRate(tier),
        buybackAmount: calculateBuybackAmount(priceCents, tier),
        deadline: getSellbackDeadline(it.order.revealedAt!).toISOString(),
      };
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-zinc-100 mb-2">Sell Back</h1>
      <p className="text-zinc-500 mb-8">
        Cards you can still sell back for wallet credit. Each offer expires 10
        minutes after reveal.
      </p>
      <BuybackList initialItems={eligible} />
    </div>
  );
}
