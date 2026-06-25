import os

FRONTEND_URL = os.getenv("VITE_API_URL")

# TEST OR DEV
DEV = os.getenv("DEV") == "TRUE"

# STORAGE / R2 CONFIGURATION

R2_ENDPOINT = os.environ["S3_API"]
R2_ACCESS_KEY = os.environ["CLOUDFLARE_R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]

R2_BUCKET = "trueswing-videos"

FFMPEG_DEFAULT_TIMESTAMP = 1.5
THUMBNAIL_BASE_PREFIX = "golf-thumbnails"
THUMBNAIL_FILENAME = "thumbnail.jpg"


# AI CONFIGURATION
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Which model runs an analysis. Single source of truth, overridable via env.
# Read through core.infrastructure.AI.model_selection.get_active_analysis_model(),
# never directly, so a future admin-board / DB-backed selector is a one-function swap.
ANALYSIS_MODEL = os.getenv("ANALYSIS_MODEL", "gemini-3.1-pro-preview")

# DATABASE CONFIGURATION


# SUPABASE CONFIGURATION
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLL_KEY = os.getenv("SUPABASE_SERVICE_ROLL_KEY")

# Stripe
STRIPE_SECRET_KEY = os.getenv("SANDBOX_STRIPE_SECRET_KEY") if DEV else os.getenv("LIVE_STRIPE_SECRET_KEY")
STRIPE_PUBLISH_KEY = os.getenv("SANDBOX_STRIPE_PUBLISH_KEY") if DEV else os.getenv("LIVE_STRIPE_PUBLISH_KEY")
PRICE_ID = os.getenv("SANDBOX_STRIPE_PRICE_ID") if DEV else os.getenv("LIVE_STRIPE_PRICE_ID")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# RevenueCat (mobile in-app purchases via App Store / Play Store)
# RevenueCat authenticates webhooks with a static shared secret that we set in
# the dashboard's webhook "Authorization header" field and compare here — it does
# not use Stripe-style HMAC signing.
REVENUECAT_WEBHOOK_AUTH_TOKEN = (
    os.getenv("SANDBOX_REVENUECAT_WEBHOOK_AUTH_TOKEN")
    if DEV
    else os.getenv("LIVE_REVENUECAT_WEBHOOK_AUTH_TOKEN")
)

# RevenueCat fans every webhook event out to ALL configured endpoints regardless
# of environment (it does not route sandbox -> dev URL, production -> live URL).
# So a SANDBOX test purchase also reaches the production backend. Each backend
# honors only its own environment and ignores the rest, so a free sandbox buy can
# never grant entitlement in production. See revenuecat_service.handle_revenuecat_webhook.
EXPECTED_REVENUECAT_ENV = "SANDBOX" if DEV else "PRODUCTION"