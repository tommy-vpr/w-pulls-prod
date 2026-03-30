// scripts/cleanup-webhook-events.ts
//
// Run daily via cron: npx tsx scripts/cleanup-webhook-events.ts
// Removes processed webhook events older than 7 days.

import "dotenv/config";
import { cleanupOldWebhookEvents } from "@/lib/utils/webhook-idempotency";

async function main() {
  console.log("🧹 Cleaning up old webhook events...");
  const deleted = await cleanupOldWebhookEvents(7);
  console.log(`✅ Removed ${deleted} old webhook event(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
