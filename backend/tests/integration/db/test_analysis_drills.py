from services.db.models.AnalysisDrill import AnalysisDrill
from services.db.models.Analysis import Analysis
from services.db.models.AnalysisIssue import AnalysisIssue
import uuid
from services.db.repositories.analysis_drills import (
    create_analysis_drill,
    get_analysis_drill_by_id,
)
from services.db.repositories.analysis import create_analysis
from services.db.repositories.analysis_issues import create_analysis_issue
import pytest


@pytest.fixture
def analysis_with_issue(db_session, test_user):
    """Create an analysis and analysis_issue for testing"""
    # Create parent analysis
    analysis = Analysis(
        user_id=test_user,
        model_version="v1.0",
    )
    created_analysis = create_analysis(analysis=analysis, session=db_session)

    # Create parent analysis issue
    issue = AnalysisIssue(
        analysis_id=created_analysis.id,
        issue_code="ISSUE_001",
        impact_rank=1,
    )
    created_issue = create_analysis_issue(analysis_issue=issue, session=db_session)

    return created_analysis, created_issue


class TestAnalysisDrillCreate:
    """Tests for creating AnalysisDrill records"""

    def test_create_analysis_drill_with_required_fields(self, db_session, analysis_with_issue):
        """Test creating an analysis drill with required fields"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )

        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert created.id is not None
        assert created.analysis_issue_id == created_issue.id
        assert created.title == "Test Drill"
        assert created.task == "Complete the drill"
        assert created.success_signal == "Ball hit straight"
        assert created.fault_indicator == "Ball hooked"
        assert created.created_at is not None

    def test_create_analysis_drill_persists_to_database(self, db_session, analysis_with_issue):
        """Test that created drill is persisted to database"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )

        create_analysis_drill(analysis_drill=drill, session=db_session)

        fetched_drill = get_analysis_drill_by_id(drill.id, session=db_session)

        assert fetched_drill is not None
        assert fetched_drill.id == drill.id
        assert fetched_drill.analysis_issue_id == created_issue.id
        assert fetched_drill.title == "Test Drill"


class TestAnalysisDrillRead:
    """Tests for reading AnalysisDrill records"""

    def test_get_analysis_drill_by_id(self, db_session, analysis_with_issue):
        """Test retrieving an analysis drill by ID"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        fetched = get_analysis_drill_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.title == "Test Drill"

    def test_get_analysis_drill_by_id_not_found(self, db_session):
        """Test retrieving a non-existent analysis drill returns None"""
        non_existent_id = uuid.uuid4()

        result = get_analysis_drill_by_id(non_existent_id, session=db_session)

        assert result is None


class TestAnalysisDrillConstraints:
    """Tests for AnalysisDrill model constraints"""

    def test_analysis_drill_id_is_uuid(self, db_session, analysis_with_issue):
        """Test that drill ID is a valid UUID"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_analysis_drill_created_at_is_set(self, db_session, analysis_with_issue):
        """Test that created_at is automatically set"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert created.created_at is not None

    def test_analysis_drill_requires_analysis_issue_id(self, db_session, test_user):
        """Test that analysis_issue_id is required"""
        drill = AnalysisDrill(
            title="Test Drill",
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )

        with pytest.raises(Exception):
            create_analysis_drill(analysis_drill=drill, session=db_session)

    def test_analysis_drill_requires_title(self, db_session, analysis_with_issue):
        """Test that title is required"""
        _, created_issue = analysis_with_issue

        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            task="Complete the drill",
            success_signal="Ball hit straight",
            fault_indicator="Ball hooked",
        )

        with pytest.raises(Exception):
            create_analysis_drill(analysis_drill=drill, session=db_session)
