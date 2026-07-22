#!/usr/bin/env bash
#
# Build, verify and publish the trueswing.se marketing site.
#
# Adapted from trueswing_admin/deploy.sh with two deliberate differences:
#
#   1. TESTS ARE A HARD GATE. This repo has no CI, so if the deploy script
#      doesn't run the suite, nothing does — and a test nobody runs is worse
#      than no test, because it manufactures confidence. The post-build project
#      is the one that proves the FAQ copy actually reached the HTML.
#
#   2. TWO TAGS: :latest and :<git-sha>. Pushing only :latest overwrites the
#      previous image, leaving no rollback target. With the SHA tag, rolling
#      back is editing one line in docker-compose.yml and pulling — seconds
#      rather than a two-architecture rebuild while the site is down.
#
# Usage:
#   ./deploy.sh          # from web/. Runs tests, builds, pushes, then PROMPTS
#                        # before deploying. Answer y to SSH in and go live;
#                        # anything else prints the manual deploy command.
#
# Prerequisites:
#   - Docker running and `docker login` done as oskarjolofsson (push target).
#   - buildx builder available (Docker Desktop ships one; else:
#       docker buildx create --use && docker buildx inspect --bootstrap).
#   - Key-based SSH to root@188.245.42.39 (used only if you confirm the deploy).
#   - Commit first: a dirty web/ tree makes the :<git-sha> tag lie about what
#     shipped, so the script warns before continuing.
#
set -euo pipefail

IMAGE="oskarjolofsson/trueswing_web"
SERVER="root@188.245.42.39"
REMOTE_DIR="/srv/trueswing"
cd "$(dirname "$0")"

if [[ -n "$(git status --porcelain -- . 2>/dev/null)" ]]; then
	echo "WARNING: web/ has uncommitted changes. The SHA tag will not match what you"
	echo "         are shipping, which defeats the point of tagging. Commit first."
	read -r -p "Continue anyway? [y/N] " reply
	[[ "$reply" == "y" || "$reply" == "Y" ]] || exit 1
fi

TAG="$(git rev-parse --short HEAD)"

echo "==> Unit tests"
npm run test

echo "==> Build (static export)"
npm run build

echo "==> Post-build assertions against out/"
npm run test:html

echo "==> Sanity: the URL the App Store points at must exist"
test -f out/legal/privacy-policy.html \
	|| { echo "FATAL: out/legal/privacy-policy.html missing — Apple's required privacy URL would 404"; exit 1; }

echo "==> Build and push ${IMAGE}:{latest,${TAG}}"
docker buildx build \
	--platform linux/amd64,linux/arm64 \
	--build-arg "GIT_COMMIT=${TAG}" \
	-t "${IMAGE}:latest" \
	-t "${IMAGE}:${TAG}" \
	--push .

echo
echo "Pushed ${IMAGE}:latest and ${IMAGE}:${TAG}"

# Reclaim local space. A multi-arch `--push` build usually leaves nothing
# loadable in `docker images` (the manifest lives only in the registry), so the
# `image rm` is mostly a no-op — hence `|| true`. The build cache is the part
# that actually grows, so `buildx prune` is what reclaims real disk.
echo
echo "==> Clean up local build artifacts"
docker image rm "${IMAGE}:latest" "${IMAGE}:${TAG}" 2>/dev/null || true
docker buildx prune -f

# Deploy to the server. Gated behind a prompt so a stray run of this script
# cannot silently redeploy production — the push above is harmless, but pulling
# and restarting the live container is not something to do by accident.
echo
read -r -p "Deploy ${TAG} to production (${SERVER})? [y/N] " reply
if [[ "$reply" == "y" || "$reply" == "Y" ]]; then
	echo "==> Deploying on ${SERVER}"
	ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose pull && docker compose up -d"
	echo
	echo "Deployed ${IMAGE}:${TAG} — live at trueswing.se"
else
	echo "Skipped deploy. To deploy later:"
	echo "  ssh ${SERVER}"
	echo "  cd ${REMOTE_DIR} && docker compose pull && docker compose up -d"
fi

echo
echo "To roll back, pin the previous SHA in docker-compose.yml:"
echo "  image: ${IMAGE}:<previous-sha>"
echo "  docker compose up -d"
