# Deploy a new backend version

Fast steps to ship a new image. Prep is shared; then pick **Preview** or **Production**.

Server: `root@188.245.42.39` · Config: `/srv/trueswing/` · Image: `oskarjolofsson/true_swing_backend`

- **Preview** → tag `:preview` → service `app-preview` → https://api.preview.trueswing.se
- **Production** → tag `:latest` → service `app` → https://api.trueswing.se

> ⚠️ Both environments share `/root/.env` (same Supabase/DB). Preview writes hit prod data.

---

## 1. Prep (shared — do once per machine)

Create a multi-platform builder (only if `docker buildx ls` shows none):

```bash
docker buildx create --use
```

```bash
docker buildx inspect --bootstrap
```

```bash
docker login
```

If env vars changed, copy the file up first:

```bash
scp /Users/oskarolofsson/ws/personal/GSA1.0/backend/.env.production root@188.245.42.39:/root/.env
```

---

## 2. Deploy to **Preview**

Build + push (from backend repo root):

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t oskarjolofsson/true_swing_backend:preview --push . && docker image rm oskarjolofsson/true_swing_backend:preview 2>/dev/null && docker buildx prune -f
```

SSH into the server:

```bash
ssh root@188.245.42.39
```

Pull + restart (on the server):

```bash
cd /srv/trueswing && docker compose pull app-preview && docker compose up -d app-preview
```

Verify:

```bash
curl -I https://api.preview.trueswing.se
```

---

## 3. Deploy to **Production**

Build + push (from backend repo root):

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t oskarjolofsson/true_swing_backend:latest --push . && docker image rm oskarjolofsson/true_swing_backend:latest 2>/dev/null && docker buildx prune -f
```

SSH into the server:

```bash
ssh root@188.245.42.39
```

Pull + restart (on the server):

```bash
cd /srv/trueswing && docker compose pull app && docker compose up -d app
```

Verify:

```bash
curl -I https://api.trueswing.se
```

---

## Test locally before deploying (optional)

Build the image:

```bash
docker build --no-cache -t trueswing-backend-test .
```

Run it:

```bash
docker run --rm -p 8000:8000 --env-file .env trueswing-backend-test
```

Full architecture / DNS / Caddy details: see [`../setup/backendAPIDeploymentSetup.md`](../setup/backendAPIDeploymentSetup.md).
