#!/usr/bin/env bash
#
# Turn a source photograph into a bundle-ready WebP for the home hero.
#
# WHY THIS EXISTS
# ---------------
# Metro bundles `require`d assets byte for byte. Nothing in the build resizes,
# recompresses or warns you, so a 2.5MB 4032x1816 camera JPG ships at 2.5MB and
# gets decoded in full on every mount of the screen — for a block that is 360pt
# tall. The cost is invisible until you look at the .ipa.
#
# So: every image goes through this before it lands in assets/hero/.
#
# USAGE
#   ./scripts/optimize-hero.sh <source> [name] [gravity]
#
#   source   any image ImageMagick can read
#   name     output basename, no extension  -> assets/hero/<name>.webp
#            defaults to the source's basename
#   gravity  which part of the frame survives the crop (default: center)
#            center north south northwest northeast southwest southeast
#
# EXAMPLES
#   ./scripts/optimize-hero.sh ~/Desktop/klittor.jpg
#   ./scripts/optimize-hero.sh ~/Desktop/dunes.jpg dunes north
#
# ON THE GEOMETRY
#   HERO_HEIGHT is 360pt (features/home/components/HomeHero.tsx) across the full
#   screen width. The widest phone we care about is ~440pt, and @3x that is
#   1320x1080 — the ceiling of what can ever be displayed. Rendering is
#   resizeMode="cover", so this script crops to cover too: what you commit is
#   what appears, and React Native never rescales at runtime.
#
#   That means a panoramic source loses most of its width. `gravity` is the knob.
#   heroImages.ts wants a calm upper third (the greeting sits there) and no
#   bright hotspot top-right (that is where the avatar lands) — so if `center`
#   puts the sun under the avatar, try `north` or `northwest`. Preview before
#   you commit; the crop is not reversible from the output.
#
# ON QUALITY
#   The script does not take a quality argument. It searches downward from 82
#   until the file fits BUDGET_KB, because the quality that hits a byte budget
#   depends on the picture — a busy tree line and an empty sky are nowhere near
#   each other on that curve. It stops at 55: below that WebP goes blotchy in
#   flat gradients like sky, which is most of what a hero photo is, and a hero
#   that fits the budget while looking cheap is not a win.
#
# OVERRIDES (env vars, for the rare non-hero case)
#   WIDTH=1320 HEIGHT=1080 BUDGET_KB=150 ./scripts/optimize-hero.sh shot.jpg

set -euo pipefail

if [[ $# -lt 1 ]]; then
	sed -n '2,46p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
fi

SRC="$1"
NAME="${2:-$(basename "${SRC%.*}")}"
GRAVITY="${3:-center}"

WIDTH="${WIDTH:-1320}"
HEIGHT="${HEIGHT:-1080}"
BUDGET_KB="${BUDGET_KB:-150}"
BUDGET_BYTES=$((BUDGET_KB * 1024))

command -v magick >/dev/null || { echo "ERROR: ImageMagick not found. brew install imagemagick"; exit 1; }
[[ -f "$SRC" ]] || { echo "ERROR: no such file: $SRC"; exit 1; }

cd "$(dirname "$0")/.."
OUT_DIR="assets/hero"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/${NAME}.webp"

SRC_BYTES=$(stat -f%z "$SRC")
echo "==> source: $SRC"
magick identify -format "    %wx%h  %[colorspace]  alpha=%A\n" "$SRC"
echo "==> target: ${WIDTH}x${HEIGHT} cover, gravity $GRAVITY, under ${BUDGET_KB}KB"

# -resize WxH^ fills the box (rather than fitting inside it) and -extent crops
# the overflow: together they are ImageMagick's resizeMode="cover".
# -strip drops EXIF, which on a phone photo is both dead weight and a GPS trail.
encode () {
	magick "$SRC" \
		-resize "${WIDTH}x${HEIGHT}^" \
		-gravity "$GRAVITY" -extent "${WIDTH}x${HEIGHT}" \
		-strip -quality "$1" "$OUT"
}

QUALITY=0
BYTES=0
for q in 82 76 70 64 58 55; do
	encode "$q"
	QUALITY="$q"
	BYTES=$(stat -f%z "$OUT")
	printf "    q%-3s %8s\n" "$q" "$(echo "$BYTES" | awk '{printf "%.0fKB", $1/1024}')"
	[[ "$BYTES" -le "$BUDGET_BYTES" ]] && break
done

echo
if [[ "$BYTES" -gt "$BUDGET_BYTES" ]]; then
	echo "!!  Still ${BYTES} bytes at q55, over the ${BUDGET_KB}KB budget."
	echo "!!  This picture has too much fine detail to compress — a busy tree line,"
	echo "!!  grain, or heavy texture. Pick a calmer photo rather than dropping"
	echo "!!  quality further; below q55 the sky posterizes visibly."
	exit 1
fi

printf "==> wrote %s  %s at q%s (%s of source)\n" \
	"$OUT" \
	"$(echo "$BYTES" | awk '{printf "%.0fKB", $1/1024}')" \
	"$QUALITY" \
	"$(echo "$BYTES $SRC_BYTES" | awk '{printf "%.1f%%", ($1/$2)*100}')"

cat <<EOF

==> use it
    In features/home/config/heroImages.ts, add to HERO_IMAGES:

      require('../../../assets/hero/${NAME}.webp'),

    Metro needs a literal path, so it has to be written out — a variable
    will not resolve.

    WebP requires expo-image. React Native's own <Image> does not decode
    WebP on iOS; HomeHero must import Image from 'expo-image'.
EOF
