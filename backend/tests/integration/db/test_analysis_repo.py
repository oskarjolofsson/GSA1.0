from services.db.models.Analysis import Analysis
import uuid
from services.db.repositories.analysis import (
    create_analysis,
    get_analysis_by_id,
    get_analyses_by_user_id,
    update_analysis,
)
import pytest
import time
from datetime import datetime, timedelta, timezone


class TestAnalysisCreate:
    """Tests for creating Analysis records"""

    def test_create_analysis_with_required_fields(self, db_session, test_user):
        """Test creating an analysis with only required fields"""
        analysis = Analysis(
            user_id=test_user,
            model_version="test-model-version",
        )

        created = create_analysis(analysis=analysis, session=db_session)

        assert created.id is not None
        assert created.user_id == test_user
        assert created.model_version == "test-model-version"
        assert created.status == "awaiting_upload"
        assert created.created_at is not None
        assert created.success is None
        assert created.error_message is None

    def test_create_analysis_with_all_fields(self, db_session, test_user):
        """Test creating an analysis with all optional fields"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="completed",
            success=True,
            raw_output_json={"key": "value"},
            error_message=None,
        )

        created = create_analysis(analysis=analysis, session=db_session)

        assert created.id is not None
        assert created.user_id == test_user
        assert created.model_version == "v1.0"
        assert created.status == "completed"
        assert created.success is True
        assert created.raw_output_json == {"key": "value"}

    def test_create_analysis_persists_to_database(self, db_session, test_user):
        """Test that created analysis is persisted to database"""
        analysis = Analysis(
            user_id=test_user,
            model_version="test-model-version",
        )

        create_analysis(analysis=analysis, session=db_session)

        fetched_analysis = get_analysis_by_id(analysis.id, session=db_session)

        assert fetched_analysis is not None
        assert fetched_analysis.id == analysis.id
        assert fetched_analysis.user_id == analysis.user_id
        assert fetched_analysis.model_version == analysis.model_version


class TestAnalysisRead:
    """Tests for reading Analysis records"""

    def test_get_analysis_by_id(self, db_session, test_user):
        """Test retrieving an analysis by ID"""
        analysis = Analysis(
            user_id=test_user,
            model_version="test-model",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        fetched = get_analysis_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.user_id == test_user
        assert fetched.model_version == "test-model"

    def test_get_analysis_by_id_not_found(self, db_session):
        """Test retrieving a non-existent analysis returns None"""
        non_existent_id = uuid.uuid4()

        result = get_analysis_by_id(non_existent_id, session=db_session)

        assert result is None

    def test_get_analyses_by_user_id_completed_and_successful(self, db_session, test_user):
        """Test retrieving only completed and successful analyses for a user"""
        # Create completed and successful analysis
        completed_analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="completed",
            success=True,
        )
        create_analysis(analysis=completed_analysis, session=db_session)

        # Create awaiting analysis (should not be returned)
        awaiting_analysis = Analysis(
            user_id=test_user,
            model_version="v2.0",
            status="awaiting_upload",
        )
        create_analysis(analysis=awaiting_analysis, session=db_session)

        # Create failed analysis (should not be returned)
        failed_analysis = Analysis(
            user_id=test_user,
            model_version="v3.0",
            status="completed",
            success=False,
        )
        create_analysis(analysis=failed_analysis, session=db_session)

        analyses = get_analyses_by_user_id(test_user, session=db_session)

        assert len(analyses) == 1
        assert analyses[0].id == completed_analysis.id
        assert analyses[0].success is True

    def test_get_analyses_by_user_id_empty(self, db_session, test_user):
        """Test retrieving analyses for a user with no completed analyses"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="awaiting_upload",
        )
        create_analysis(analysis=analysis, session=db_session)

        analyses = get_analyses_by_user_id(test_user, session=db_session)

        assert len(analyses) == 0

    def test_get_analyses_by_user_id_ordered_by_newest(self, db_session, test_user):
        """Test that analyses are returned in descending order by created_at"""
        now = datetime.now(timezone.utc)

        analysis1 = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="completed",
            success=True,
            created_at=now - timedelta(seconds=1),  # Older
        )
        create_analysis(analysis=analysis1, session=db_session)

        analysis2 = Analysis(
            user_id=test_user,
            model_version="v2.0",
            status="completed",
            success=True,
            created_at=now,  # Newer
        )
        create_analysis(analysis=analysis2, session=db_session)

        analyses = get_analyses_by_user_id(test_user, session=db_session)

        assert len(analyses) == 2
        assert analyses[0].id == analysis2.id, "Expected the newest analysis first"
        assert analyses[1].id == analysis1.id, "Expected the older analysis second"


class TestAnalysisUpdate:
    """Tests for updating Analysis records"""

    def test_update_analysis_status(self, db_session, test_user):
        """Test updating analysis status"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="awaiting_upload",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        created.status = "processing"
        updated = update_analysis(created, session=db_session)

        fetched = get_analysis_by_id(updated.id, session=db_session)
        assert fetched.status == "processing"

    def test_update_analysis_success_and_output(self, db_session, test_user):
        """Test updating analysis with success flag and output"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="completed",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        created.success = True
        created.raw_output_json = {"results": "test data"}
        updated = update_analysis(created, session=db_session)

        fetched = get_analysis_by_id(updated.id, session=db_session)
        assert fetched.success is True
        assert fetched.raw_output_json == {"results": "test data"}

    def test_update_analysis_error_message(self, db_session, test_user):
        """Test updating analysis with error message"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
            status="failed",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        created.success = False
        created.error_message = "Processing failed: timeout"
        updated = update_analysis(created, session=db_session)

        fetched = get_analysis_by_id(updated.id, session=db_session)
        assert fetched.success is False
        assert fetched.error_message == "Processing failed: timeout"

    def test_update_analysis_with_video_id(self, db_session, test_user):
        """Test updating analysis with a video ID"""
        video_id = uuid.uuid4()
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        created.video_id = video_id
        updated = update_analysis(created, session=db_session)

        fetched = get_analysis_by_id(updated.id, session=db_session)
        assert fetched.video_id == video_id


class TestAnalysisConstraints:
    """Tests for Analysis model constraints"""

    def test_valid_status_values(self, db_session, test_user):
        """Test all valid status values"""
        valid_statuses = ["awaiting_upload", "processing", "completed", "failed"]

        for status in valid_statuses:
            analysis = Analysis(
                user_id=test_user,
                model_version="v1.0",
                status=status,
            )
            created = create_analysis(analysis=analysis, session=db_session)
            assert created.status == status

    def test_default_status_is_awaiting_upload(self, db_session, test_user):
        """Test that default status is awaiting_upload"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        assert created.status == "awaiting_upload"

    def test_analysis_created_at_is_set(self, db_session, test_user):
        """Test that created_at is automatically set"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        assert created.created_at is not None

    def test_analysis_id_is_uuid(self, db_session, test_user):
        """Test that analysis ID is a valid UUID"""
        analysis = Analysis(
            user_id=test_user,
            model_version="v1.0",
        )
        created = create_analysis(analysis=analysis, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_user_id_is_required(self, db_session, test_user):
        """Test that user_id is required"""
        analysis = Analysis(
            model_version="v1.0",
        )
        with pytest.raises(Exception):
            create_analysis(analysis=analysis, session=db_session)

    def test_model_version_is_required(self, db_session, test_user):
        """Test that model_version is required"""
        analysis = Analysis(
            user_id=test_user,
        )
        with pytest.raises(Exception):
            create_analysis(analysis=analysis, session=db_session)


