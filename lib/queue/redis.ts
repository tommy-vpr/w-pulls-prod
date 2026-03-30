// lib/queue/redis.ts

import { ConnectionOptions } from "bullmq";

const url = process.env.REDIS_URL;
if (!url) throw new Error("Missing REDIS_URL");

const parsed = new URL(url);
const isSecure = parsed.protocol === "rediss:";

export const connection: ConnectionOptions = {
  host: parsed.hostname,
  port: parseInt(parsed.port, 10) || 6379,
  password: parsed.password || undefined,
  ...(isSecure ? { tls: {} } : {}), // TLS only for rediss:// (Upstash)
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};
