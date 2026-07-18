#!/usr/bin/env bash
#
# Build and push the multi-arch admin image to Docker Hub.
#
# The NEXT_PUBLIC_* config is baked into the client bundle at build time (see
# Dockerfile), so this script expands a gitignored .env.production into --build-arg
# flags. That keeps the values out of your shell history.
#
# Usage:
#   ./deploy.sh            # build + push :latest (production)
#
# First-time setup:
#   cp .env.example .env.production   # then fill in the prod values
#   docker buildx create --use && docker buildx inspect --bootstrap
#   docker login

set -euo pipefail

IMAGE="oskarjolofsson/true_swing_admin"
TAG="latest"
ENV_FILE=".env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found. Create it from .env.example:" >&2
  echo "  cp .env.example $ENV_FILE   # then fill in the values" >&2
  exit 1
fi

# Turn each non-comment NEXT_PUBLIC_* line into a --build-arg flag.
BUILD_ARGS=()
while IFS='=' read -r key value; do
  # skip blanks and comments
  [[ -z "$key" || "$key" == \#* ]] && continue
  # only bake the public config; ignore anything else in the file
  [[ "$key" != NEXT_PUBLIC_* ]] && continue
  # strip surrounding quotes and trailing whitespace/CR
  value="${value%$'\r'}"
  value="${value%\"}"; value="${value#\"}"
  BUILD_ARGS+=(--build-arg "${key}=${value}")
done < "$ENV_FILE"

if [[ ${#BUILD_ARGS[@]} -eq 0 ]]; then
  echo "error: no NEXT_PUBLIC_* values found in $ENV_FILE" >&2
  exit 1
fi

GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

echo "Building ${IMAGE}:${TAG} (commit ${GIT_COMMIT}) for linux/amd64,linux/arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  --build-arg "GIT_COMMIT=${GIT_COMMIT}" \
  "${BUILD_ARGS[@]}" \
  -t "${IMAGE}:${TAG}" --push .

# Clean up local cache the same way the backend deploy does.
docker image rm "${IMAGE}:${TAG}" 2>/dev/null || true
docker buildx prune -f

echo "Done. Pushed ${IMAGE}:${TAG}"
echo "On the server: cd /srv/trueswing && docker compose pull && docker compose up -d"
