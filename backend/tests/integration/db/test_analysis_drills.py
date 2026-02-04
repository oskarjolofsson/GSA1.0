from ....core.infrastructure.db.models.AnalysisDrill import AnalysisDrill
from ....core.infrastructure.db.models.Analysis import Analysis
from ....core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from ....core.infrastructure.db.models.Drill import Drill
from ....core.infrastructure.db.models.Issue import Issue
import uuid
from ....core.infrastructure.db.repositories.analysis_drills import (
    create_analysis_drill,
    get_analysis_drill_by_id,
)
from ....core.infrastructure.db.repositories.analysis import create_analysis
from ....core.infrastructure.db.repositories.analysis_issues import create_analysis_issue
from ....core.infrastructure.db.repositories.drills import create_drill
from ....core.infrastructure.db.repositories.issues import create_issue
import pytest


@pytest.fixture
def test_drill(db_session):
    """Create a drill for testing"""
    drill = Drill(
        title="Weight Shift Drill",
        task="Practice shifting weight from trail to lead foot",
        success_signal="Ball struck cleanly with divot after ball",
        fault_indicator="Ball topped or thin contact",
    )
    return create_drill(drill=drill, session=db_session)


@pytest.fixture
def test_issue(db_session):
    """Create an issue for testing"""
    issue = Issue(
        title="Hanging Back",
        phase="IMPACT",
        severity="MAJOR",
        current_motion="Weight stays on trail foot through impact",
        expected_motion="Weight should shift to lead foot by impact",
        swing_effect="Reduces power and consistency",
        shot_outcome="Thin or topped shots",
    )
    return create_issue(issue=issue, session=db_session)


@pytest.fixture
def analysis_with_issue(db_session, test_user, test_issue):
    """Create an analysis and analysis_issue for testing"""
    # Create parent analysis
    analysis = Analysis(
        user_id=test_user,
        model_version="v1.0",
    )
    created_analysis = create_analysis(analysis=analysis, session=db_session)

    # Create parent analysis issue
    analysis_issue = AnalysisIssue(
        analysis_id=created_analysis.id,
        issue_id=test_issue.id,
        impact_rank=1,
    )
    created_issue = create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

    return created_analysis, created_issue


class TestAnalysisDrillCreate:
    """Tests for creating AnalysisDrill records"""

    def test_create_analysis_drill_with_required_fields(self, db_session, analysis_with_issue, test_drill):
        """Test creating an analysis drill with required fields"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            drill_id=test_drill.id,
        )

        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert created.id is not None
        assert created.analysis_issue_id == created_issue.id
        assert created.drill_id == test_drill.id
        assert created.created_at is not None

    def test_create_analysis_drill_persists_to_database(self, db_session, analysis_with_issue, test_drill):
        """Test that created drill is persisted to database"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            drill_id=test_drill.id,
        )

        create_analysis_drill(analysis_drill=drill, session=db_session)

        fetched_drill = get_analysis_drill_by_id(drill.id, session=db_session)

        assert fetched_drill is not None
        assert fetched_drill.id == drill.id
        assert fetched_drill.analysis_issue_id == created_issue.id
        assert fetched_drill.drill_id == test_drill.id


class TestAnalysisDrillRead:
    """Tests for reading AnalysisDrill records"""

    def test_get_analysis_drill_by_id(self, db_session, analysis_with_issue, test_drill):
        """Test retrieving an analysis drill by ID"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            drill_id=test_drill.id,
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        fetched = get_analysis_drill_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.drill_id == test_drill.id

    def test_get_analysis_drill_by_id_not_found(self, db_session):
        """Test retrieving a non-existent analysis drill returns None"""
        non_existent_id = uuid.uuid4()

        result = get_analysis_drill_by_id(non_existent_id, session=db_session)

        assert result is None


class TestAnalysisDrillConstraints:
    """Tests for AnalysisDrill model constraints"""

    def test_analysis_drill_id_is_uuid(self, db_session, analysis_with_issue, test_drill):
        """Test that drill ID is a valid UUID"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            drill_id=test_drill.id,
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_analysis_drill_created_at_is_set(self, db_session, analysis_with_issue, test_drill):
        """Test that created_at is automatically set"""
        _, created_issue = analysis_with_issue

        # Create analysis drill
        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
            drill_id=test_drill.id,
        )
        created = create_analysis_drill(analysis_drill=drill, session=db_session)

        assert created.created_at is not None

    def test_analysis_drill_requires_analysis_issue_id(self, db_session, test_drill):
        """Test that analysis_issue_id is required"""
        drill = AnalysisDrill(
            drill_id=test_drill.id,
        )

        with pytest.raises(Exception):
            create_analysis_drill(analysis_drill=drill, session=db_session)

    def test_analysis_drill_requires_drill_id(self, db_session, analysis_with_issue):
        """Test that drill_id is required"""
        _, created_issue = analysis_with_issue

        drill = AnalysisDrill(
            analysis_issue_id=created_issue.id,
        )

        with pytest.raises(Exception):
            create_analysis_drill(analysis_drill=drill, session=db_session)

