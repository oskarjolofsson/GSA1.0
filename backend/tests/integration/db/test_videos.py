from ....core.infrastructure.db.models.Video import Video
import uuid
from ....core.infrastructure.db.repositories.videos import (
    create_video,
    get_video_by_id,
    get_video_by_user_id,
)
from datetime import timedelta
import pytest


class TestVideoCreate:
    """Tests for creating Video records"""

    def test_create_video_with_required_fields(self, db_session, test_user):
        """Test creating a video with required fields"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/test_video.mp4",
            camera_view="unknown",
            club_type="unknown",
        )

        created = create_video(video=video, session=db_session)

        assert created.id is not None
        assert created.user_id == test_user
        assert created.video_key == "videos/test_video.mp4"
        assert created.camera_view == "unknown"
        assert created.club_type == "unknown"
        assert created.start_time is None
        assert created.end_time is None
        assert created.created_at is not None

    def test_create_video_with_all_fields(self, db_session, test_user):
        """Test creating a video with all optional fields"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/full_video.mp4",
            start_time=timedelta(seconds=5),
            end_time=timedelta(seconds=15),
            camera_view="face_on",
            club_type="driver",
        )

        created = create_video(video=video, session=db_session)

        assert created.id is not None
        assert created.user_id == test_user
        assert created.video_key == "videos/full_video.mp4"
        assert created.start_time == timedelta(seconds=5)
        assert created.end_time == timedelta(seconds=15)
        assert created.camera_view == "face_on"
        assert created.club_type == "driver"

    def test_create_video_persists_to_database(self, db_session, test_user):
        """Test that created video is persisted to database"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/persist_test.mp4",
            camera_view="down_the_line",
            club_type="iron",
        )

        created = create_video(video=video, session=db_session)

        fetched_video = get_video_by_id(created.id, session=db_session)

        assert fetched_video is not None
        assert fetched_video.id == created.id
        assert fetched_video.video_key == "videos/persist_test.mp4"
        assert fetched_video.camera_view == "down_the_line"
        assert fetched_video.club_type == "iron"


class TestVideoRead:
    """Tests for reading Video records"""

    def test_get_video_by_id(self, db_session, test_user):
        """Test retrieving a video by ID"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/test_by_id.mp4",
            camera_view="face_on",
            club_type="driver",
        )
        created = create_video(video=video, session=db_session)

        fetched = get_video_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.video_key == "videos/test_by_id.mp4"

    def test_get_video_by_id_not_found(self, db_session):
        """Test retrieving a non-existent video returns None"""
        non_existent_id = uuid.uuid4()

        result = get_video_by_id(non_existent_id, session=db_session)

        assert result is None

    def test_get_video_by_user_id(self, db_session, test_user):
        """Test retrieving a video by user ID"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/test_by_user.mp4",
            camera_view="face_on",
            club_type="iron",
        )
        created = create_video(video=video, session=db_session)

        fetched = get_video_by_user_id(test_user, session=db_session)

        assert fetched is not None
        assert fetched.user_id == test_user
        assert fetched.video_key == "videos/test_by_user.mp4"


class TestVideoConstraints:
    """Tests for Video model constraints"""

    def test_video_id_is_uuid(self, db_session, test_user):
        """Test that video ID is a valid UUID"""
        # Create video
        video = Video(
            user_id=test_user,
            video_key="videos/uuid_test.mp4",
            camera_view="unknown",
            club_type="unknown",
        )
        created = create_video(video=video, session=db_session)

        assert isinstance(created.id, uuid.UUID)
        assert isinstance(created.user_id, uuid.UUID)

    def test_valid_camera_view_values(self, db_session, test_user):
        """Test all valid camera_view values"""
        valid_views = ["unknown", "face_on", "down_the_line"]

        for idx, view in enumerate(valid_views):
            video = Video(
                user_id=test_user,
                video_key=f"videos/camera_{view}.mp4",
                camera_view=view,
                club_type="unknown",
            )
            created = create_video(video=video, session=db_session)
            assert created.camera_view == view

    def test_valid_club_type_values(self, db_session, test_user):
        """Test all valid club_type values"""
        valid_types = ["unknown", "iron", "driver"]

        for idx, club_type in enumerate(valid_types):
            video = Video(
                user_id=test_user,
                video_key=f"videos/club_{club_type}.mp4",
                camera_view="unknown",
                club_type=club_type,
            )
            created = create_video(video=video, session=db_session)
            assert created.club_type == club_type

    def test_video_requires_user_id(self, db_session):
        """Test that user_id is required"""
        video = Video(
            video_key="videos/no_user.mp4",
            camera_view="unknown",
            club_type="unknown",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)

    def test_video_requires_video_key(self, db_session, test_user):
        """Test that video_key is required"""
        video = Video(
            user_id=test_user,
            camera_view="unknown",
            club_type="unknown",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)

    def test_video_requires_camera_view(self, db_session, test_user):
        """Test that camera_view is required"""
        video = Video(
            user_id=test_user,
            video_key="videos/no_camera.mp4",
            club_type="unknown",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)
            db_session.flush()

    def test_video_requires_club_type(self, db_session, test_user):
        """Test that club_type is required"""
        video = Video(
            user_id=test_user,
            video_key="videos/no_club.mp4",
            camera_view="unknown",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)
            db_session.flush()

    def test_video_invalid_camera_view(self, db_session, test_user):
        """Test that invalid camera_view is rejected"""
        video = Video(
            user_id=test_user,
            video_key="videos/invalid_camera.mp4",
            camera_view="invalid_view",
            club_type="unknown",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)
            db_session.commit()

    def test_video_invalid_club_type(self, db_session, test_user):
        """Test that invalid club_type is rejected"""
        video = Video(
            user_id=test_user,
            video_key="videos/invalid_club.mp4",
            camera_view="unknown",
            club_type="invalid_club",
        )

        with pytest.raises(Exception):
            create_video(video=video, session=db_session)
            db_session.commit()
