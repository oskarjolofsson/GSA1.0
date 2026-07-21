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
set -euo pipefail

IMAGE="oskarjolofsson/trueswing_web"
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
echo
echo "On the server:"
echo "  ssh root@188.245.42.39"
echo "  cd /srv/trueswing && docker compose pull && docker compose up -d"
echo
echo "To roll back, pin the previous SHA in docker-compose.yml:"
echo "  image: ${IMAGE}:<previous-sha>"
echo "  docker compose up -d"
