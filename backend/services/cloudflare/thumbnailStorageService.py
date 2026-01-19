import boto3
import os
import subprocess
import tempfile
import os
import uuid


R2_ENDPOINT = "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_ACCESS_KEY = os.environ["R2_ACCESS_KEY"]
R2_SECRET_KEY = os.environ["R2_SECRET_KEY"]
VIDEO_BUCKET = "golf-videos"
THUMB_BUCKET = "golf-thumbnails"

r2 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

def download_video(bucket: str, key: str, local_path: str):
    r2.download_file(bucket, key, local_path)

def extract_thumbnail(input_path: str, output_path: str, timestamp: float = 1.5):
    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(timestamp),
        "-i", input_path,
        "-frames:v", "1",
        "-q:v", "2",
        output_path,
    ]

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def upload_thumbnail(bucket: str, key: str, local_path: str):
    with open(local_path, "rb") as f:
        r2.upload_fileobj(
            f,
            bucket,
            key,
            ExtraArgs={"ContentType": "image/jpeg"},
        )


def generate_thumbnail_for_video(video_key: str) -> str:
    tmp_dir = tempfile.mkdtemp()
    local_video = os.path.join(tmp_dir, "input.mp4")
    local_thumb = os.path.join(tmp_dir, "thumb.jpg")

    try:
        # 1) Download
        download_video(VIDEO_BUCKET, video_key, local_video)

        # 2) Extract frame
        extract_thumbnail(local_video, local_thumb, timestamp=1.5)

        # 3) Upload thumbnail
        thumb_key = video_key.rsplit(".", 1)[0] + ".jpg"
        upload_thumbnail(THUMB_BUCKET, thumb_key, local_thumb)

        return thumb_key

    finally:
        # Cleanup temp files
        for path in [local_video, local_thumb]:
            if os.path.exists(path):
                os.remove(path)
        if os.path.exists(tmp_dir):
            os.rmdir(tmp_dir)


# def on_video_upload_complete(video_key: str):
#     thumb_key = generate_thumbnail_for_video(video_key)

#     # Save thumbnail key or URL in DB
#     thumbnail_url = f"https://<PUBLIC_R2_DOMAIN>/{thumb_key}"
#     save_thumbnail_for_video(video_key, thumbnail_url)
