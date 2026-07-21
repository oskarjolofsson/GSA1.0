# Two stages: build the static export with Node, then serve it with Caddy.
# The runner carries no Node runtime — it is a ~15MB image holding HTML, CSS,
# JS and a static file server. Nothing in it executes application code.

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Stamped into the page so you can tell which build is live without shelling in.
ARG GIT_COMMIT=unknown
ENV NEXT_PUBLIC_GIT_COMMIT=$GIT_COMMIT

RUN npm run build

# ---- runner ----
FROM caddy:2-alpine AS runner
COPY --from=builder /app/out /srv/web
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
