import os

R2_ENDPOINT = os.environ["S3_API"]
R2_ACCESS_KEY = os.environ["CLOUDFLARE_R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]

R2_BUCKET = "trueswing-videos"

FFMPEG_DEFAULT_TIMESTAMP = 1.5
THUMBNAIL_BASE_PREFIX = "golf-thumbnails"
THUMBNAIL_FILENAME = "thumbnail.webp"