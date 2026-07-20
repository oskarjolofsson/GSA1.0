# TrueSwing Backend

FastAPI service powering TrueSwing: swing analysis, drills, practice sessions, and billing.

## Prerequisites

- Python 3.11+
- Docker (optional — `Dockerfile` and `docker-compose.yml` are here if you'd rather not manage a venv)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. Interactive docs are at
`http://localhost:8000/docs`.

## Environment variables

Create a `.env` in this directory:

```env
# App URLs
VITE_API_URL=
VITE_API_URL2=
DEV=

# AI
OPENAI_API_KEY=
GEMINI_API_KEY=

# Cloudflare R2
S3_API=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=

# Supabase
DATABASE_URL=
DATABASE_PASSWORD=
SUPABASE_ACCESS_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLL_KEY=

# Stripe (optional for local dev — only needed to exercise billing)
SANDBOX_STRIPE_SECRET_KEY=
SANDBOX_STRIPE_PUBLISH_KEY=
SANDBOX_STRIPE_PRICE_ID=
LIVE_STRIPE_SECRET_KEY=
LIVE_STRIPE_PUBLISH_KEY=
STRIPE_WEBHOOK_SECRET=

# RevenueCat (optional for local dev — only needed to exercise mobile billing)
SANDBOX_REVENUECAT_WEBHOOK_AUTH_TOKEN=
LIVE_REVENUECAT_WEBHOOK_AUTH_TOKEN=
```

The Stripe and RevenueCat groups are optional for a plain local boot. Everything
above them is required.

## Tests

```bash
pytest tests/
```

The suite needs two sample swing videos (~2 seconds each) that are not committed:

```bash
mkdir -p uploads/video
# uploads/video/golf.mp4      — a golf swing
# uploads/video/non_golf.mp4  — anything that isn't one
```

## More docs

- [`docs/setup/`](docs/setup) — deployment setup
- [`docs/howToUseAPI/README.md`](docs/howToUseAPI/README.md) — API reference
- [`docs/howToDeploy/`](docs/howToDeploy) — deploys and Supabase migrations
