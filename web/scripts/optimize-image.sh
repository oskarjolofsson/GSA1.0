#!/usr/bin/env bash
#
# Turn a source image into web-ready WebP at two widths.
#
# WHY THIS EXISTS
# ---------------
# `output: "export"` in next.config.ts forces `images.unoptimized: true`. Next
# will NOT convert, resize or compress anything — whatever lands in public/ is
# served byte for byte. A 1.6MB PNG hero is the single most expensive thing you
# can do to Lighthouse on this site, and nothing in the build will warn you.
#
# So: every image goes through this before it goes in public/.
#
# USAGE
#   ./scripts/optimize-image.sh <source> <name> [quality] [crop]
#
#   source   any image ImageMagick can read
#   name     output basename, no extension  -> public/<name>.webp + <name>-1280.webp
#   quality  default 78. See the note below before changing it.
#   crop     optional ImageMagick geometry, e.g. 1150x857+850+0
#
# EXAMPLES
#   ./scripts/optimize-image.sh ~/Desktop/shot.png program-step
#   ./scripts/optimize-image.sh ../docs/images/media/README_image.png hero 78 1150x857+850+0
#
# ON QUALITY
#   The size/quality curve flattens hard around 78. Measured on the hero photo:
#     q95 = 134KB   q85 = 52KB   q78 = 38KB   q65 = 30KB   q50 = 27KB
#   Below 78 you give up visible quality to save almost nothing. Above 85 you
#   pay a lot of bytes for detail nobody sees. Raise it only for images with
#   fine text or hard edges (a UI screenshot), not for photos.
#
# ON TRANSPARENCY
#   WebP keeps alpha, so logos and device frames survive. But if the image is
#   flat-colour artwork rather than a photo, PNG may already be smaller — the
#   script tells you when that happens.

set -euo pipefail

if [[ $# -lt 2 ]]; then
	sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
fi

SRC="$1"
NAME="$2"
QUALITY="${3:-78}"
CROP="${4:-}"

command -v magick >/dev/null || { echo "ERROR: ImageMagick not found. brew install imagemagick"; exit 1; }
[[ -f "$SRC" ]] || { echo "ERROR: no such file: $SRC"; exit 1; }

cd "$(dirname "$0")/.."
OUT_DIR="public"
mkdir -p "$OUT_DIR"

SRC_BYTES=$(stat -f%z "$SRC")
echo "==> source: $SRC"
magick identify -format "    %wx%h  %[colorspace]  alpha=%A\n" "$SRC"

# Writes the human-readable size report to STDERR and only the byte count to
# STDOUT, so `$(build ...)` captures the number without swallowing the report.
build () {
	local width="$1" suffix="$2"
	local out="$OUT_DIR/${NAME}${suffix}.webp"
	if [[ -n "$CROP" ]]; then
		magick "$SRC" -crop "$CROP" +repage -resize "${width}x" -quality "$QUALITY" "$out"
	else
		magick "$SRC" -resize "${width}x" -quality "$QUALITY" "$out"
	fi
	local bytes; bytes=$(stat -f%z "$out")
	printf "    %-28s %8s  (%s of source)\n" \
		"$(basename "$out")" \
		"$(echo "$bytes" | awk '{printf "%.0fKB", $1/1024}')" \
		"$(echo "$bytes $SRC_BYTES" | awk '{printf "%.1f%%", ($1/$2)*100}')" >&2
	echo "$bytes"
}

echo "==> writing WebP at q$QUALITY"
DESKTOP_BYTES=$(build 1920 "")
build 1280 "-1280" >/dev/null

# Sanity: warn if WebP lost to the source, which happens with flat-colour art.
if [[ "$DESKTOP_BYTES" -gt "$SRC_BYTES" ]]; then
	echo
	echo "!!  The WebP is LARGER than the source. That usually means this is flat-colour"
	echo "!!  artwork, not a photo. Keep the original format instead."
fi

echo
echo "==> use it"
cat <<EOF
    <Image
      src="/${NAME}.webp"
      alt="describe what is happening, not 'image of'"
      width={1920} height={$(magick identify -format '%h' "$OUT_DIR/${NAME}.webp")}
      sizes="100vw"
    />

    Add \`priority\` ONLY if it is above the fold — it disables lazy loading.
    Never add \`priority\` to more than one image per page.
EOF
