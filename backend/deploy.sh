#!/usr/bin/env bash
#
# Build and push the multi-arch backend image to Docker Hub, then pull + restart
# it on the server. Mirrors docs/howToDeploy/howToDeployBackend.md.
#
# Unlike the admin image, no config is baked into the build: the backend reads
# its env from /root/.env on the server (shared by both environments). Only the
# GIT_COMMIT is passed in, so the "/" route can report exactly what's live.
#
# Usage:
#   ./deploy.sh preview        # tag :preview  -> service app-preview -> api.preview.trueswing.se
#   ./deploy.sh production     # tag :latest   -> service app         -> api.trueswing.se
#   ./deploy.sh production --sync-env   # scp .env.production to the server first
#
# First-time setup (once per machine):
#   docker buildx create --use && docker buildx inspect --bootstrap
#   docker login
#
# WARNING: both environments share /root/.env (same Supabase/DB).
#          Preview writes hit prod data.

set -euo pipefail

IMAGE="oskarjolofsson/true_swing_backend"
SERVER="root@188.245.42.39"
ENV_FILE=".env.production"

# --- Resolve the target environment into a tag / service / host --------------
ENVIRONMENT="${1:-}"
case "$ENVIRONMENT" in
  preview)
    TAG="preview"; SERVICE="app-preview"; HOST="api.preview.trueswing.se" ;;
  production|prod)
    TAG="latest";  SERVICE="app";         HOST="api.trueswing.se" ;;
  *)
    echo "usage: ./deploy.sh {preview|production} [--sync-env]" >&2
    exit 1 ;;
esac

SYNC_ENV="${2:-}"

# --- Optionally sync env up (only when env vars changed) ---------------------
if [[ "$SYNC_ENV" == "--sync-env" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "error: $ENV_FILE not found; cannot --sync-env" >&2
    exit 1
  fi
  echo "Syncing ${ENV_FILE} -> ${SERVER}:/root/.env ..."
  scp "$ENV_FILE" "${SERVER}:/root/.env"
fi

GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

# --- Build + push, then clean up local cache ---------------------------------
echo "Building ${IMAGE}:${TAG} (commit ${GIT_COMMIT}) for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  --build-arg "GIT_COMMIT=${GIT_COMMIT}" \
  -t "${IMAGE}:${TAG}" --push .

docker image rm "${IMAGE}:${TAG}" 2>/dev/null || true
docker buildx prune -f

# --- Pull + restart on the server --------------------------------------------
echo "Pulling + restarting ${SERVICE} on ${SERVER}..."
ssh "$SERVER" "cd /srv/trueswing && docker compose pull ${SERVICE} && docker compose up -d ${SERVICE}"

# --- Verify ------------------------------------------------------------------
echo "Verifying https://${HOST} ..."
curl -I "https://${HOST}" || true

echo "Live commit:"
curl -s "https://${HOST}/" | grep -o '"commit":"[^"]*"' || true

echo "Done. Deployed ${IMAGE}:${TAG} (commit ${GIT_COMMIT}) to ${ENVIRONMENT}."
