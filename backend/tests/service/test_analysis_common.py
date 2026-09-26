"""Helpers shared by the v1 and v2 analysis services."""

import subprocess

import pytest

from core.services.analysis_common import make_thumbnail_jpeg

JPEG_MAGIC = b"\xff\xd8"


def test_thumbnail_is_a_jpeg_frame(sample_video_path):
    thumbnail = make_thumbnail_jpeg(str(sample_video_path))

    assert thumbnail.startswith(JPEG_MAGIC)


def test_thumbnail_raises_when_ffmpeg_fails(tmp_path):
    """The callers catch this and fall back to a placeholder; swallowing it here would
    hand them empty bytes to upload instead."""
    with pytest.raises(subprocess.CalledProcessError):
        make_thumbnail_jpeg(str(tmp_path / "missing.mp4"))
