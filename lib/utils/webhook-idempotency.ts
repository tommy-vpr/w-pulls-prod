// lib/utils/webhook-idempotency.ts

import prisma from "@/lib/prisma";

/**
 * Check if a Stripe webhook event has already been processed.
 * Uses unique constraint on event ID to handle race conditions.
 *
 * @returns true if this event is new and should be processed
 * @returns false if this event was already processed (skip it)
 */
export async function claimWebhookEvent(eventId: string): Promise<boolean> {
  try {
    await prisma.processedWebhookEvent.create({
      data: { id: eventId },
    });
    return true; // Successfully claimed — process this event
  } catch (error: any) {
    // Unique constraint violation = already processed
    if (error.code === "P2002") {
      return false;
    }
    // Unknown error — rethrow
    throw error;
  }
}

/**
 * Clean up old processed events (run via cron, e.g. daily)
 * Stripe retries for up to 72 hours, so keep events for 7 days to be safe.
 */
export async function cleanupOldWebhookEvents(daysToKeep = 7): Promise<number> {
  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.processedWebhookEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
