import os
import tempfile

from .config import (
    FFMPEG_DEFAULT_TIMESTAMP,
    THUMBNAIL_BASE_PREFIX,
    THUMBNAIL_FILENAME,
    R2_BUCKET,
)

from .r2Client import r2_client
from .ffmpeg_utils import extract_thumbnail_webp


def make_thumbnail_key(video_key: str) -> str:
    
    video_name = os.path.basename(video_key)
    base, _ = os.path.splitext(video_name)

    return f"{THUMBNAIL_BASE_PREFIX}/{base}.webp"


def generate_thumbnail_for_video(video_key: str) -> str:
    tmp_dir = tempfile.mkdtemp()
    local_video = os.path.join(tmp_dir, "input_video")
    local_thumb = os.path.join(tmp_dir, THUMBNAIL_FILENAME)

    try:
        # 1) Download video bytes from R2
        video_bytes = r2_client.get_object(video_key)

        with open(local_video, "wb") as f:
            f.write(video_bytes)

        # 2) Extract frame with FFmpeg
        extract_thumbnail_webp(
            local_video,
            local_thumb,
            timestamp=FFMPEG_DEFAULT_TIMESTAMP,
        )

        # 3) Upload thumbnail back to R2 using boto3 client directly
        thumb_key = make_thumbnail_key(video_key)

        with open(local_thumb, "rb") as f:
            r2_client.s3.put_object(
                Bucket=R2_BUCKET,
                Key=thumb_key,
                Body=f,
                ContentType="image/webp",
            )

        return thumb_key

    finally:
        # Cleanup temp files
        for path in (local_video, local_thumb):
            if os.path.exists(path):
                os.remove(path)

        if os.path.exists(tmp_dir):
            os.rmdir(tmp_dir)
