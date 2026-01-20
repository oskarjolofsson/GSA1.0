# backend/media/ffmpeg_utils.py

import subprocess


def extract_thumbnail_webp(
    input_path: str,
    output_path: str,
    timestamp: float,
) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(timestamp),
        "-i", input_path,
        "-frames:v", "1",
        "-c:v", "libwebp",
        "-quality", "85",
        output_path,
    ]

    subprocess.run(cmd, check=True)
