import { PrismaClient, ProductTier } from "@prisma/client";
import { TIER_VALUE_BANDS } from "@/lib/packs/bands";
import { PACK_CONFIGS } from "../lib/packs/config";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/* CONFIG                                                             */
/* ------------------------------------------------------------------ */

const CATEGORY = "POKEMON" as const;

const PRODUCTS_PER_BUCKET: Record<ProductTier, number> = {
  COMMON: 10,
  UNCOMMON: 8,
  RARE: 6,
  ULTRA_RARE: 5,
  SECRET_RARE: 4,
  BANGER: 3,
  GRAIL: 2,
};

const INVENTORY_PER_PRODUCT: Record<ProductTier, [number, number]> = {
  COMMON: [25, 50],
  UNCOMMON: [15, 30],
  RARE: [8, 15],
  ULTRA_RARE: [4, 8],
  SECRET_RARE: [2, 5],
  BANGER: [1, 3],
  GRAIL: [1, 1],
};

const TIER_IMAGE_MAP: Record<ProductTier, string> = {
  COMMON: "https://storage.googleapis.com/w-pulls-images/common.png",
  UNCOMMON: "https://storage.googleapis.com/w-pulls-images/uncommon.png",
  RARE: "https://storage.googleapis.com/w-pulls-images/rare.png",
  ULTRA_RARE: "https://storage.googleapis.com/w-pulls-images/ultra_rare.png",
  SECRET_RARE: "https://storage.googleapis.com/w-pulls-images/secret_rare.png",
  BANGER: "https://storage.googleapis.com/w-pulls-images/banger.png",
  GRAIL: "https://storage.googleapis.com/w-pulls-images/grail.png",
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomInventory(tier: ProductTier) {
  const [min, max] = INVENTORY_PER_PRODUCT[tier];
  return randomBetween(min, max);
}

function priceInBand(tier: ProductTier, packPriceCents: number) {
  const packPrice = packPriceCents / 100;
  const { minMult, maxMult } = TIER_VALUE_BANDS[tier];
  const min = packPrice * minMult;
  const max = packPrice * maxMult;
  const u = Math.pow(Math.random(), 1.5); // skew low
  return Number((min + (max - min) * u).toFixed(2));
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ------------------------------------------------------------------ */
/* RESET — wipe product/order data, KEEP users + wallets              */
/* ------------------------------------------------------------------ */

async function resetProductData() {
  console.log("🧹 Resetting product + order data (users preserved)...");

  // 1. Null out FKs from preserved tables INTO data we're about to delete.
  //    WalletTransaction.orderItemId has no cascade — must null first or
  //    OrderItem deletes fail. The numeric credit/debit record is preserved.
  const nulled = await prisma.walletTransaction.updateMany({
    where: { orderItemId: { not: null } },
    data: { orderItemId: null },
  });
  console.log(`   • Nulled ${nulled.count} WalletTransaction.orderItemId refs`);

  // 2. Delete in FK dependency order. Cascades handle child rows.
  const ship = await prisma.shipmentRequest.deleteMany({});
  console.log(`   • Deleted ${ship.count} ShipmentRequests (+ items)`);

  const orders = await prisma.order.deleteMany({});
  console.log(`   • Deleted ${orders.count} Orders (+ items + audits)`);

  const products = await prisma.product.deleteMany({});
  console.log(`   • Deleted ${products.count} Products (+ audits)`);

  const webhooks = await prisma.processedWebhookEvent.deleteMany({});
  console.log(`   • Deleted ${webhooks.count} ProcessedWebhookEvents`);

  console.log("✅ Reset complete — Users, Wallets, Withdrawals preserved");
}

/* ------------------------------------------------------------------ */
/* SEED                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("🌱 W-Pulls reseed — keeping users\n");

  await resetProductData();

  console.log("\n📦 Seeding products per (pack × tier) band...");

  let total = 0;

  for (const pack of PACK_CONFIGS) {
    console.log(`\n   ${pack.displayPrice} ${pack.name}`);

    for (const tier of pack.allowedTiers) {
      const count = PRODUCTS_PER_BUCKET[tier];

      for (let i = 0; i < count; i++) {
        const title = `${tier.replace("_", " ")} for ${pack.displayPrice} #${i + 1}`;
        const slug = slugify(
          `${title}-${pack.id}-${i}-${Date.now()}-${Math.random()}`,
        );
        const sku = `POKEMON-${pack.id}-${tier}-${i}-${Date.now()}`;

        await prisma.product.create({
          data: {
            title,
            slug,
            description: `Seeded ${tier.replace("_", " ")} for ${pack.displayPrice} pack`,
            tier,
            category: CATEGORY,
            price: priceInBand(tier, pack.price),
            inventory: randomInventory(tier),
            imageUrl: TIER_IMAGE_MAP[tier],
            sku,
            isActive: true,
          },
        });
        total += 1;
      }

      console.log(`      ${tier}: ${count} products`);
    }
  }

  console.log(
    `\n🎉 Seeded ${total} products across ${PACK_CONFIGS.length} packs\n`,
  );

  // Final sanity print
  const userCount = await prisma.user.count();
  const walletCount = await prisma.userWallet.count();
  const txCount = await prisma.walletTransaction.count();
  console.log(
    `👥 Preserved: ${userCount} users, ${walletCount} wallets, ${txCount} wallet transactions`,
  );
}

/* ------------------------------------------------------------------ */
/* RUN                                                                */
/* ------------------------------------------------------------------ */

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
