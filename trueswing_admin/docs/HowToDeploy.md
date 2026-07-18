# How to Deploy the Admin Dashboard

Deploying = build a Docker image on your machine, push it to Docker Hub, then
pull and run it on the server. Same pattern as the backend.

## One-time setup

On your machine:

```bash
cp .env.example .env.production   # then fill in the PROD values
docker buildx create --use
docker buildx inspect --bootstrap
docker login                      # log in to Docker Hub (oskarjolofsson)
```

`.env.production` holds the three public config values that get baked into the
build. It is gitignored — never commit it.

> **Why baked in?** Next.js inlines every `NEXT_PUBLIC_*` value into the app at
> build time, not at runtime. So config is chosen when you build the image, not
> when you run it. All three values are public/safe to expose.

## Deploy (every time)

### 1. Build + push the image (your machine)

```bash
./deploy.sh            # builds and pushes :latest (production)
```

This reads `.env.production`, builds for amd64 + arm64, and pushes to Docker Hub.

### 2. Pull + run on the server

```bash
ssh root@188.245.42.39
cd /srv/trueswing
docker compose pull
docker compose up -d
```

Done. The site is live at https://admin.trueswing.se

### 3. Check it worked

```bash
docker compose ps            # admin container should be "Up"
docker compose logs -f admin # watch for errors (Ctrl+C to exit)
```

Or from your machine: `curl -sI https://admin.trueswing.se` (expect `200`).

## First-time server setup (only once)

If the admin service isn't in the server's compose file yet:

1. **DNS** — in Netlify, add an `A` record: name `admin`, value `188.245.42.39`.
   Confirm with `dig +short admin.trueswing.se` before continuing.
2. **Compose** — add the `admin` service to `/srv/trueswing/docker-compose.yml`
   (see `docker-compose.admin.yml` in this repo for the block to paste).
3. **Caddy** — add a route to `/srv/trueswing/Caddyfile`:
   ```
   admin.trueswing.se {
       reverse_proxy admin:3000
   }
   ```
   Then reload: `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`

Caddy handles HTTPS certificates automatically once DNS points at the server.

## Test the image locally (optional)

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --build-arg NEXT_PUBLIC_API_URL=... \
  -t trueswing-admin-test .
docker run --rm -p 3000:3000 trueswing-admin-test
# open http://localhost:3000
```

## Troubleshooting

- **Site doesn't load after deploy** → reload Caddy (step 3 above). Check
  `dig +short admin.trueswing.se` returns the server IP.
- **Google sign-in redirects to `0.0.0.0:3000`** → make sure you deployed the
  image built after the forwarded-header fix, and that Supabase Auth →
  URL Configuration allowlists `https://admin.trueswing.se/**`.
- **`docker compose pull` finds nothing new** → you forgot to run `./deploy.sh`
  first, or pushed a different tag than the compose file references.
