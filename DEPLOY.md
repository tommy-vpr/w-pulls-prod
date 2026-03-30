# W-Pulls — Hetzner / Coolify Deployment Guide

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Hetzner VPS (Coolify)                            │
│                                                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  web          │  │  worker      │  │  redis   │ │
│  │  Next.js :3000│  │  BullMQ x4   │  │  :6379   │ │
│  │               │  │              │  │  Alpine  │ │
│  └──────┬───────┘  └──────┬──────┘  └────┬─────┘ │
│         │                  │              │        │
│         └──────────────────┴──────────────┘        │
│              (internal Docker network)              │
└─────────────────────┬────────────────────────────── ┘
                      │
        ┌─────────────▼──────────────┐
        │     External Services       │
        │                             │
        │  Neon (Postgres)           │
        │  Stripe (Payments)         │
        │  GCS (Image storage)       │
        │  Resend (Email)            │
        └─────────────────────────────┘
```

**3 containers, 1 VPS:**

| Container | Image                 | Purpose                                                                        |
| --------- | --------------------- | ------------------------------------------------------------------------------ |
| `redis`   | `redis:7-alpine`      | Job queue + caching (self-hosted)                                              |
| `web`     | Dockerfile → `web`    | Next.js app on port 3000                                                       |
| `worker`  | Dockerfile → `worker` | 4 BullMQ workers (pack reveal, order abandon, product fulfillment, withdrawal) |

## Files Changed / Added

### Replaced (overwrite existing):

| File                            | What changed                                        |
| ------------------------------- | --------------------------------------------------- |
| `lib/queue/redis.ts`            | `UPSTASH_REDIS_URL` → `REDIS_URL`, auto-detects TLS |
| `scripts/enqueue-both.ts`       | `UPSTASH_REDIS_URL` → `REDIS_URL`                   |
| `scripts/enqueue-pack.ts`       | `UPSTASH_REDIS_URL` → `REDIS_URL`                   |
| `scripts/inspect-pack-queue.ts` | `UPSTASH_REDIS_URL` → `REDIS_URL`                   |
| `next.config.ts`                | Added `output: 'standalone'` for Docker             |

### New files (add to project):

| File                      | Purpose                               |
| ------------------------- | ------------------------------------- |
| `Dockerfile`              | Multi-target build (web + worker)     |
| `docker-compose.yml`      | All 3 services with self-hosted Redis |
| `.dockerignore`           | Keeps image small                     |
| `.env.example`            | All env vars documented               |
| `app/api/health/route.ts` | Health check endpoint                 |
| `DEPLOY.md`               | This file                             |

## Step-by-Step

### 1. Unzip & Update Local .env

Unzip into your project root, then update `.env.local` for local dev:

```bash
# Replace UPSTASH_REDIS_URL with REDIS_URL
# .env.local
REDIS_URL=redis://localhost:6379
```

If you run Redis locally via Docker for dev:

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Or keep using Upstash for local dev — the new `redis.ts` auto-detects TLS:

```bash
REDIS_URL=rediss://:password@host:port
```

### 2. Commit & Push

```bash
git add -A
git commit -m "Self-hosted Redis + Coolify deployment"
git push
```

### 3. Create Resource in Coolify

1. Coolify dashboard → **Projects** → select/create project
2. **+ Add Resource** → **Docker Compose**
3. Connect your GitHub repo (`tommy-vpr/W-Pullss`)
4. Coolify auto-detects `docker-compose.yml`

### 4. Configure Environment Variables

In Coolify UI → your resource → **Environment Variables**:

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=your-neon-connection-string
DIRECT_URL=your-neon-direct-connection-string
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
AUTH_SECRET=your-auth-secret
BUYBACK_QUOTE_SECRET=your-buyback-secret
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GCP_PROJECT_ID=xxx
GCP_CLIENT_EMAIL=xxx
GCP_PRIVATE_KEY=xxx
GCP_BUCKET_NAME=xxx
GCS_PUBLIC_URL=xxx
RESEND_API_KEY=xxx
RESEND_AUDIENCE_ID=xxx
```

**You do NOT need to set REDIS_URL** — it's hardcoded in docker-compose.yml
as `redis://redis:6379` (the internal Docker hostname).

> **Important:** Set `NEXT_PUBLIC_APP_URL` as a **Build Argument** too
> (Coolify UI → Build → Args) because Next.js bakes it in at build time.

### 5. Configure Domain

1. Click on the **web** service in Coolify
2. **Settings** → **Domains**
3. Add your domain (e.g. `wpulls.com`)
4. Coolify auto-provisions SSL via Let's Encrypt

### 6. Deploy

Click **Deploy**. Coolify will:

1. Pull `redis:7-alpine`
2. Build the `web` image (Dockerfile target=web)
3. Build the `worker` image (Dockerfile target=worker)
4. Start Redis first (healthcheck: `redis-cli ping`)
5. Start web + worker after Redis is healthy
6. Proxy traffic to web:3000

### 7. Run Database Migration (first deploy only)

SSH into your Hetzner server:

```bash
# Find the web container
docker ps | grep web

# Run migration
docker exec -it <container-id> npx prisma migrate deploy
```

### 8. Update Stripe Webhook URL

Stripe Dashboard → Webhooks → update endpoint:

```
https://your-domain.com/api/webhook/stripe
```

## Post-Deploy Checklist

- [ ] Site loads at your domain with SSL
- [ ] `curl https://your-domain.com/api/health` returns `{"status":"ok"}`
- [ ] Can sign in (Google OAuth working)
- [ ] Can purchase a pack (Stripe charge goes through)
- [ ] Pack reveal works (worker picks up job from Redis)
- [ ] Wallet balance shows after buyback
- [ ] Stripe Connect onboarding works
- [ ] Withdrawal processes successfully
- [ ] Redis data persists across container restarts

## Useful Commands

```bash
# View logs
docker compose logs -f web
docker compose logs -f worker
docker compose logs -f redis

# Restart a service
docker compose restart worker

# Check Redis is working
docker exec -it <redis-container> redis-cli ping
# → PONG

# Check Redis queue counts
docker exec -it <redis-container> redis-cli keys "bull:*"

# Run reconciliation
docker exec -it <worker-container> npx tsx scripts/reconcile-wallets.ts

# Run webhook cleanup
docker exec -it <worker-container> npx tsx scripts/cleanup-webhook-events.ts
```

## Cron Jobs (Optional)

SSH into Hetzner and add to crontab:

```bash
crontab -e

# Daily at 3am: reconcile wallets
0 3 * * * docker exec $(docker ps -qf "name=worker") npx tsx scripts/reconcile-wallets.ts >> /var/log/W-Pullss-reconcile.log 2>&1

# Daily at 4am: cleanup old webhook events
0 4 * * * docker exec $(docker ps -qf "name=worker") npx tsx scripts/cleanup-webhook-events.ts >> /var/log/W-Pullss-cleanup.log 2>&1
```

## Redis Notes

- Data persists in a Docker volume (`redis-data`)
- 256MB memory limit with `noeviction` policy (BullMQ needs this — never evict jobs)
- If VPS restarts, Redis restarts automatically (`restart: unless-stopped`)
- AOF (append-only file) enabled for durability — pending jobs survive crashes
- No password set since it's only accessible within the Docker network (not exposed to internet)

### If you need Redis password (extra security):

Update `docker-compose.yml`:

```yaml
redis:
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy noeviction --requirepass yourpassword
```

Update `REDIS_URL` in web and worker services:

```yaml
- REDIS_URL=redis://:yourpassword@redis:6379
```

## VPS Sizing

For W-Pulls's traffic level, a Hetzner **CX22** (2 vCPU, 4GB RAM) should handle all 3 containers comfortably:

| Container         | Expected RAM   |
| ----------------- | -------------- |
| Redis             | ~50-100MB      |
| Web (Next.js)     | ~200-400MB     |
| Worker (4 BullMQ) | ~150-300MB     |
| **Total**         | **~400-800MB** |

Scale up to CX32 (4 vCPU, 8GB) if traffic grows.
