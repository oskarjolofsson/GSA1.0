import pytest
from datetime import timedelta
from ...core.services.analysis_service import create_analysis
from ...core.services.dtos.analysis_service_dto import CreateAnalysisDTO
from ...core.infrastructure.db.repositories.analysis import get_analysis_by_id
from ...core.infrastructure.db.repositories.videos import get_video_by_id


class TestCreateAnalysis:
    """Tests for create_analysis function"""

    def test_create_analysis_creates_video_record(self, mock_service_session, test_user):
        """Test that create_analysis creates a video record with correct fields"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=5),
            end_time=timedelta(seconds=15),
        )

        # Act
        result = create_analysis(dto)

        # Assert - Verify analysis was created
        analysis = get_analysis_by_id(result["analysis_id"], session=mock_service_session)
        assert analysis is not None

        # Verify video was created with correct fields
        video = get_video_by_id(analysis.video_id, session=mock_service_session)
        assert video is not None
        assert video.user_id == test_user
        assert video.start_time == timedelta(seconds=5)
        assert video.end_time == timedelta(seconds=15)
        assert video.video_key == f"videos/{video.id}"

    def test_create_analysis_creates_analysis_record(self, mock_service_session, test_user):
        """Test that create_analysis creates an analysis record with correct fields"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v2.0",
            start_time=timedelta(seconds=10),
            end_time=timedelta(seconds=20),
        )

        # Act
        result = create_analysis(dto)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=mock_service_session)
        assert analysis is not None
        assert analysis.user_id == test_user
        assert analysis.model_version == "v2.0"
        assert analysis.video_id is not None

    def test_create_analysis_returns_correct_values(self, mock_service_session, test_user):
        """Test that create_analysis returns analysis_id and upload_url"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=0),
            end_time=timedelta(seconds=10),
        )

        # Act
        result = create_analysis(dto)

        # Assert
        assert "analysis_id" in result
        assert "upload_url" in result
        assert result["analysis_id"] is not None
        assert result["upload_url"] is not None
        assert isinstance(result["upload_url"], str)
        assert len(result["upload_url"]) > 0

    def test_create_analysis_video_key_matches_video_id(self, mock_service_session, test_user):
        """Test that video_key is set to videos/{video.id}"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=0),
            end_time=timedelta(seconds=5),
        )

        # Act
        result = create_analysis(dto)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=mock_service_session)
        video = get_video_by_id(analysis.video_id, session=mock_service_session)
        
        assert video.video_key == f"videos/{video.id}"

    def test_create_analysis_links_video_to_analysis(self, mock_service_session, test_user):
        """Test that the created video is properly linked to the analysis"""
        # Arrange
        dto = CreateAnalysisDTO(
            user_id=test_user,
            model="v1.0",
            start_time=timedelta(seconds=2),
            end_time=timedelta(seconds=8),
        )

        # Act
        result = create_analysis(dto)

        # Assert
        analysis = get_analysis_by_id(result["analysis_id"], session=mock_service_session)
        video = get_video_by_id(analysis.video_id, session=mock_service_session)
        
        assert analysis.video_id == video.id
