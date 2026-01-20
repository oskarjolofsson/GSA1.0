# backend/media/thumbnail_service.py

import os
import tempfile

from backend.cloudflare.config import (
    R2_BUCKET,
    FFMPEG_DEFAULT_TIMESTAMP,
    THUMBNAIL_FILENAME,
)

from backend.cloudflare.r2_client import download_file, upload_file
from backend.cloudflare.ffmpeg_utils import extract_thumbnail_webp


def make_thumbnail_key(video_key: str) -> str:
    if not video_key.lower().endswith((".mp4", ".mov")):
        raise ValueError(f"Unexpected video key format: {video_key}")

    return video_key.rsplit("/", 1)[0] + f"/{THUMBNAIL_FILENAME}"


def generate_thumbnail_for_video(video_key: str) -> str:
    tmp_dir = tempfile.mkdtemp()
    local_video = os.path.join(tmp_dir, "input_video")
    local_thumb = os.path.join(tmp_dir, THUMBNAIL_FILENAME)

    try:
        # 1) Download video
        download_file(R2_BUCKET, video_key, local_video)

        # 2) Extract frame
        extract_thumbnail_webp(
            local_video,
            local_thumb,
            timestamp=FFMPEG_DEFAULT_TIMESTAMP,
        )

        # 3) Upload thumbnail
        thumb_key = make_thumbnail_key(video_key)

        upload_file(
            R2_BUCKET,
            thumb_key,
            local_thumb,
            content_type="image/webp",
        )

        return thumb_key

    finally:
        # Cleanup
        for path in (local_video, local_thumb):
            if os.path.exists(path):
                os.remove(path)

        if os.path.exists(tmp_dir):
            os.rmdir(tmp_dir)
