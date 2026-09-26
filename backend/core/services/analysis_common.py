"""Pieces the v1 and v2 analysis services share.

Kept free of storage calls on purpose: each service does its own R2 reads and writes,
so tests patching `analysis_service.put_object` keep intercepting them.
"""

import os
import subprocess
import tempfile
from uuid import UUID

from ..infrastructure.db.repositories.analysis import get_analysis_by_id
from .exceptions import ForbiddenException, NotFoundException


def load_owned_analysis(analysis_id: UUID, user_id: UUID, db_session):
    """Load an analysis and authorize the caller as its owner.

    Every analysis endpoint addresses a row by an id taken from the request, so the
    ownership comparison belongs here rather than in each caller. Not-found is raised
    before forbidden: the id is an unguessable UUID, so a caller holding one that does
    not exist learns nothing from the distinction.
    """
    analysis_object = get_analysis_by_id(analysis_id=analysis_id, session=db_session)
    if analysis_object is None:
        raise NotFoundException("Analysis", str(analysis_id))

    if analysis_object.user_id != user_id:
        raise ForbiddenException("You do not have access to this analysis.")

    return analysis_object


def make_thumbnail_jpeg(video_path: str, timestamp: float = 1.5) -> bytes:
    """One JPEG frame from `video_path` at `timestamp` seconds. Raises if ffmpeg fails.

    Works in a temporary directory and always cleans it up. The caller decides whether a
    failure matters; both services treat a missing thumbnail as a placeholder, not an error.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        local_thumb = os.path.join(tmp_dir, "thumbnail.jpg")
        _extract_thumbnail_jpeg(video_path, local_thumb, timestamp=timestamp)
        with open(local_thumb, "rb") as f:
            return f.read()


def _extract_thumbnail_jpeg(
    input_path: str,
    output_path: str,
    timestamp: float,
) -> None:
    # JPEG (mjpeg) thumbnail — decoded natively on every client, no WebP coder
    # needed. -q:v 3 is high-quality but tiny for a single frame.
    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(timestamp),
        "-i", input_path,
        "-frames:v", "1",
        "-q:v", "3",
        output_path,
    ]

    subprocess.run(cmd, check=True)
