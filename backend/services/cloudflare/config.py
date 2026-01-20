import os

R2_ENDPOINT = "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_ACCESS_KEY = os.environ["R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["R2_SECRET_KEY"]

R2_BUCKET = "trueswing-videos"

FFMPEG_DEFAULT_TIMESTAMP = 1.5
THUMBNAIL_FILENAME = "thumbnail.webp"