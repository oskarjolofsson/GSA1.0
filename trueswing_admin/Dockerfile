# syntax=docker/dockerfile:1

# Multi-stage build for the Next.js 16 admin dashboard.
#
# Unlike the backend (single-stage Python, reads .env at RUNTIME), Next.js inlines
# every NEXT_PUBLIC_* value into the client JS bundle at BUILD time. Those three
# values are public/safe to expose (the Supabase anon key is client-side by design),
# so we bake them in via --build-arg here — the same pattern the backend uses for
# GIT_COMMIT. See deploy.sh for the build-arg expansion.

# ---- deps: install node_modules from the lockfile (cached unless deps change) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: bake NEXT_PUBLIC_* into the client bundle, then next build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public config, inlined into client JS during `next build`. Not secrets.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Deploy-time git SHA, baked so the app can report exactly what's live (as backend).
ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

RUN npm run build

# ---- runner: minimal standalone server, non-root ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Run as an unprivileged user (design for tired humans at 3am, not for root).
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# standalone traces only what's needed; static + public are copied in explicitly.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]


# --- First-time setup (run once) ---
# docker buildx create --use
# docker buildx inspect --bootstrap
# docker login

# --- Deploy (multi-arch, pushes to Docker Hub) ---
# Prefer ./deploy.sh which expands .env.production into --build-arg flags:
#   ./deploy.sh            # -> :latest  (production)
#
# Equivalent raw command:
# docker buildx build --platform linux/amd64,linux/arm64    --build-arg GIT_COMMIT=$(git rev-parse --short HEAD)    --build-arg NEXT_PUBLIC_SUPABASE_URL=https://ravbetnydtdxiuisypct.supabase.co    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdmJldG55ZHRkeGl1aXN5cGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjc1NzIsImV4cCI6MjA4NDk0MzU3Mn0.klq57RDoWCvkwjOf75zVBpsVL1gQOQ1d0qdudi6aT1Q    --build-arg NEXT_PUBLIC_API_URL=https://api.trueswing.se     -t oskarjolofsson/true_swing_admin:latest --push .    && docker image rm oskarjolofsson/true_swing_admin:latest 2>/dev/null && docker buildx prune -f

# --- Pull and run on the server ---
# cd /srv/trueswing
# docker compose pull admin
# docker compose up -d admin

# --- Test the image locally ---
# docker build --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) --build-arg NEXT_PUBLIC_SUPABASE_URL=https://ravbetnydtdxiuisypct.supabase.co   --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdmJldG55ZHRkeGl1aXN5cGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjc1NzIsImV4cCI6MjA4NDk0MzU3Mn0.klq57RDoWCvkwjOf75zVBpsVL1gQOQ1d0qdudi6aT1Q   --build-arg NEXT_PUBLIC_API_URL=https://api.trueswing.se   -t trueswing-admin-test .
# docker run --rm -p 3000:3000 trueswing-admin-test
