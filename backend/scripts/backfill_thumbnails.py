"""
One-off backfill: regenerate analysis thumbnails as JPEG.

The app generates JPEG thumbnails now (clients couldn't decode the old WebP).
This regenerates a JPEG for every video that has a thumbnail_key, from the
video still stored in R2, and repoints thumbnail_key at the new `.jpg` object.

Idempotent — safe to re-run. Videos whose source object is gone are skipped
(their thumbnail stays absent and the app shows a placeholder).

Run from the backend/ directory:

    python -m scripts.backfill_thumbnails
"""

import os
import sys
import tempfile

import dotenv

# Make `core` importable when run as a plain script from backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv.load_dotenv()

from sqlalchemy import select  # noqa: E402

from core.infrastructure.db.session import SessionLocal  # noqa: E402
from core.infrastructure.db.models.Video import Video  # noqa: E402
from core.infrastructure.storage.r2Adaptor import get_object, put_object  # noqa: E402
from core.infrastructure.local_files.file_types.Video_file import Video_file  # noqa: E402
from core.services.analysis_service import _extract_thumbnail_jpeg  # noqa: E402


def main() -> None:
    db = SessionLocal()
    regenerated = 0
    skipped = 0
    try:
        videos = db.execute(
            select(Video).where(Video.thumbnail_key.isnot(None))
        ).scalars().all()
        print(f"Videos with a thumbnail_key: {len(videos)}")

        for video in videos:
            new_key = f"thumbnails/{video.id}.jpg"

            if not video.video_key:
                print(f"  skip {video.id}: no video_key")
                skipped += 1
                continue

            try:
                video_data = get_object(video.video_key)
            except Exception as e:
                print(f"  skip {video.id}: source video missing ({e})")
                skipped += 1
                continue

            video_file = Video_file(f=video_data)
            tmp_dir = tempfile.mkdtemp()
            local_thumb = os.path.join(tmp_dir, "thumbnail.jpg")
            try:
                _extract_thumbnail_jpeg(video_file.path(), local_thumb, timestamp=1.5)
                with open(local_thumb, "rb") as f:
                    put_object(key=new_key, data=f.read(), content_type="image/jpeg")
                video.thumbnail_key = new_key
                db.add(video)
                regenerated += 1
                print(f"  ok   {new_key}")
            except Exception as e:
                print(f"  skip {video.id}: extract/upload failed ({e})")
                skipped += 1
            finally:
                if os.path.exists(local_thumb):
                    os.remove(local_thumb)
                if os.path.exists(tmp_dir):
                    os.rmdir(tmp_dir)
                video_file.remove()

        db.commit()
        print(f"Done. regenerated={regenerated} skipped={skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
