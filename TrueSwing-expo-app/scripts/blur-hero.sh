#!/usr/bin/env bash
#
# Turn a source photograph into a pre-blurred, bundle-ready WebP for an
# "ambient" background — a photo dimmed and blurred so far it reads as mood
# or texture rather than a scene, the way features/intro's picking screens
# use `assets/hero/ambient-*.webp` behind flat content.
#
# WHY PRE-BLUR RATHER THAN A LIVE BLUR (expo-blur / CSS filter)
# ---------------------------------------------------------------
# A live GPU blur re-renders every frame, differs in quality between iOS
# (UIVisualEffectView) and Android (RenderScript/algorithmic), and costs
# battery for a background that never changes. Baking the blur into the
# asset once is free at runtime and looks identical on every device.
#
# USAGE
#   ./scripts/blur-hero.sh <source> [name] [blur] [saturation] [width]
#
#   source      any image ImageMagick can read
#   name        output basename, no extension -> assets/hero/<name>.webp
#               defaults to the source's basename
#   blur        gaussian blur sigma in px (default: 10). Bigger = blurrier.
#               Try 4 (barely soft) up to 20 (pure color wash).
#   saturation  percent, 100 = unchanged (default: 80, slightly muted)
#   width       output width in px (default: 900). The blur radius is in
#               absolute pixels, so changing width changes how strong a
#               given blur value LOOKS — keep width fixed while you dial
#               blur, or the two fight each other.
#
# EXAMPLES
#   ./scripts/blur-hero.sh assets/hero/hero6.webp ambient-goal
#   ./scripts/blur-hero.sh assets/hero/hero6.webp ambient-goal 16      # blurrier
#   ./scripts/blur-hero.sh assets/hero/hero6.webp ambient-goal 6 100   # sharper, full color
#
# ON THE BLUR ITSELF
#   `-blur 0xN` — the `0` tells ImageMagick to pick the pixel radius
#   automatically from the sigma `N`, which is the actual blur strength.
#   `-modulate 100,S` keeps brightness/hue and scales saturation to S%.

set -euo pipefail

if [[ $# -lt 1 ]]; then
	sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
fi

SRC="$1"
NAME="${2:-$(basename "${SRC%.*}")}"
BLUR="${3:-10}"
SATURATION="${4:-80}"
WIDTH="${5:-900}"

command -v magick >/dev/null || { echo "ERROR: ImageMagick not found. brew install imagemagick"; exit 1; }
[[ -f "$SRC" ]] || { echo "ERROR: no such file: $SRC"; exit 1; }
SRC="$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")"

cd "$(dirname "$0")/.."
OUT_DIR="assets/hero"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/${NAME}.webp"

echo "==> source: $SRC"
magick identify -format "    %wx%h\n" "$SRC"
echo "==> width ${WIDTH}px, blur sigma ${BLUR}, saturation ${SATURATION}%"

magick "$SRC" -resize "${WIDTH}x" -blur "0x${BLUR}" -modulate "100,${SATURATION}" -quality 68 "$OUT"

BYTES=$(stat -f%z "$OUT")
printf "==> wrote %s  %s\n" "$OUT" "$(echo "$BYTES" | awk '{printf "%.0fKB", $1/1024}')"

cat <<EOF

==> use it
    require('../../../assets/hero/${NAME}.webp')

    Re-run with a different blur value to taste — nothing here is final
    until you like what's on screen. The overlay on top (see
    IntroAmbientBackground.tsx) also does real work: a stronger overlay
    forgives a weaker blur, and vice versa.
EOF
