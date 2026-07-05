# Backend Infrastructure Deployment

How the TrueSwing API is deployed: two environments (production + preview), one Hetzner server, one Caddy reverse proxy handling both.

## Architecture

- **Server**: single Hetzner Ubuntu box (`188.245.42.39`)
- **Reverse proxy**: one Caddy container handles TLS + routing for all domains
- **Backend containers**: one container per environment, all on the same Docker network (`trueswing_default`), routed by Caddy via Docker Compose service name
- **Config location**: `/srv/trueswing/`
- **Env vars**: all environments currently share `/root/.env` (same Supabase/DB/secrets) — be careful with destructive migrations or writes from non-prod environments, since they hit the same data as prod

| | Production | Preview |
|---|---|---|
| Domain | `api.trueswing.se` | `api.preview.trueswing.se` |
| Compose service | `app` | `app-preview` |
| Container name | `trueswing-backend` | `trueswing-backend-preview` |
| Image tag | `:latest` | `:preview` |
| Env file | `/root/.env` | `/root/.env` (shared) |

Adding another environment later (e.g. `staging`) means repeating this same pattern: new compose service, new container name, new image tag, new Caddy block, new DNS record.

## DNS (Netlify)

DNS for `trueswing.se` is managed on Netlify (domain purchased via Loopia). Each API subdomain is an A record (and optionally AAAA for IPv6) pointing at the server:

| Type | Name | Value |
|---|---|---|
| A | `api` | `188.245.42.39` |
| A | `api.preview` | `188.245.42.39` |
| AAAA | `api` / `api.preview` | `2a01:4f8:1c1c:f3cb::1` (optional) |

Note: the Name field is just the subdomain (e.g. `api.preview`, no `@` prefix) — Netlify appends `.trueswing.se` automatically.

## `docker-compose.yml`

```yaml
services:
  app:
    image: oskarjolofsson/true_swing_backend:latest
    container_name: trueswing-backend
    restart: unless-stopped
    expose:
      - "8000"
    env_file:
      - /root/.env

  app-preview:
    image: oskarjolofsson/true_swing_backend:preview
    container_name: trueswing-backend-preview
    restart: unless-stopped
    expose:
      - "8000"
    env_file:
      - /root/.env

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
      - app-preview

volumes:
  caddy_data:
  caddy_config:
```

Neither `app` nor `app-preview` publish a host port — Caddy reaches both over the internal Docker network using the Compose **service name** (`app`, `app-preview`), not the container name.

## `Caddyfile`

```
api.trueswing.se {
    reverse_proxy app:8000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}

api.preview.trueswing.se {
    reverse_proxy app-preview:8000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}
```

Caddy auto-issues and renews Let's Encrypt certs for every domain listed here — no manual Certbot steps needed. Each one just needs port 80 open and its DNS record resolving to the server for the ACME HTTP-01 challenge to succeed.

## Building and pushing an image

From the backend repo, on whichever branch corresponds to the target environment:

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t oskarjolofsson/true_swing_backend:<tag> --push . \
  && docker image rm oskarjolofsson/true_swing_backend:<tag> 2>/dev/null \
  && docker buildx prune -f
```

Use `latest` for production, `preview` for the preview environment.

- `--push` is required for multi-platform builds (can't `--load` multi-arch images locally)
- `buildx prune -f` clears build cache (arm64 builds via emulation generate a lot of it)
- Requires a `docker-container` buildx builder (`docker buildx ls` to check) — the default `docker` driver can't do multi-platform builds

Verify both platforms landed on Docker Hub without pulling:

```bash
docker buildx imagetools inspect oskarjolofsson/true_swing_backend:<tag>
```

## Deploying

Deploy one environment at a time by targeting its Compose service:

```bash
ssh <server>
cd /srv/trueswing
docker compose pull <service>
docker compose up -d <service>
```

Where `<service>` is `app` (production) or `app-preview` (preview).

### If the Caddyfile itself changes (new domain, new headers, etc.)

Compose won't restart `caddy` automatically unless the `caddy` service block itself changed. Reload it manually so it picks up the new config without downtime:

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
docker compose logs -f caddy   # confirm cert issuance for any new domain
```

## Verifying a deploy

```bash
# Confirm image tags/IDs differ between environments
docker images oskarjolofsson/true_swing_backend

# Confirm which image a running container is actually on
docker inspect <container_name> --format '{{.Config.Image}}'

# Confirm the endpoint is live
curl -I https://api.trueswing.se
curl -I https://api.preview.trueswing.se

# If DNS issues are suspected
dig api.preview.trueswing.se +short
```

## Adding a new environment later

1. Add a new service block in `docker-compose.yml` (new container name + image tag, same `env_file` pattern)
2. Add a matching site block in `Caddyfile` pointing at the new service name
3. Add a DNS A record on Netlify for the new subdomain
4. `docker compose up -d` to start the new container, then `docker exec caddy caddy reload --config /etc/caddy/Caddyfile` to pick up the Caddyfile change