// lib/queue/orderAbandon.queue.ts
import { Queue } from "bullmq";
import { connection } from "./redis";

export const orderAbandonQueue = new Queue("order-abandon", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  },
});
