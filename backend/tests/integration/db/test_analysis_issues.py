from ....core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from ....core.infrastructure.db.models.Analysis import Analysis
from ....core.infrastructure.db.models.Issue import Issue
import uuid
from ....core.infrastructure.db.repositories.analysis_issues import (
    create_analysis_issue,
    get_analysis_issue_by_id,
)
from ....core.infrastructure.db.repositories.analysis import create_analysis
from ....core.infrastructure.db.repositories.issues import create_issue
import pytest


@pytest.fixture
def test_analysis(db_session, test_user):
    """Create an analysis for testing"""
    analysis = Analysis(
        user_id=test_user,
        model_version="v1.0",
    )
    return create_analysis(analysis=analysis, session=db_session)


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


class TestAnalysisIssueCreate:
    """Tests for creating AnalysisIssue records"""

    def test_create_analysis_issue_with_required_fields(self, db_session, test_analysis, test_issue):
        """Test creating an analysis issue with required fields"""
        # Create analysis issue
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=1,
        )

        created = create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

        assert created.id is not None
        assert created.analysis_id == test_analysis.id
        assert created.issue_id == test_issue.id
        assert created.impact_rank == 1
        assert created.confidence is None

    def test_create_analysis_issue_with_all_fields(self, db_session, test_analysis, test_issue):
        """Test creating an analysis issue with all optional fields"""
        # Create analysis issue
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=3,
            confidence=0.85,
        )

        created = create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

        assert created.id is not None
        assert created.analysis_id == test_analysis.id
        assert created.issue_id == test_issue.id
        assert created.impact_rank == 3
        assert created.confidence == 0.85

    def test_create_analysis_issue_persists_to_database(self, db_session, test_analysis, test_issue):
        """Test that created issue is persisted to database"""
        # Create analysis issue
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=1,
        )

        create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

        fetched_issue = get_analysis_issue_by_id(analysis_issue.id, session=db_session)

        assert fetched_issue is not None
        assert fetched_issue.id == analysis_issue.id
        assert fetched_issue.analysis_id == test_analysis.id
        assert fetched_issue.issue_id == test_issue.id


class TestAnalysisIssueRead:
    """Tests for reading AnalysisIssue records"""

    def test_get_analysis_issue_by_id(self, db_session, test_analysis, test_issue):
        """Test retrieving an analysis issue by ID"""
        # Create analysis issue
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=1,
        )
        created = create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

        fetched = get_analysis_issue_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.issue_id == test_issue.id

    def test_get_analysis_issue_by_id_not_found(self, db_session):
        """Test retrieving a non-existent analysis issue returns None"""
        non_existent_id = uuid.uuid4()

        result = get_analysis_issue_by_id(non_existent_id, session=db_session)

        assert result is None


class TestAnalysisIssueConstraints:
    """Tests for AnalysisIssue model constraints"""

    def test_analysis_issue_id_is_uuid(self, db_session, test_analysis, test_issue):
        """Test that issue ID is a valid UUID"""
        # Create analysis issue
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=1,
        )
        created = create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_analysis_issue_requires_analysis_id(self, db_session, test_issue):
        """Test that analysis_id is required"""
        analysis_issue = AnalysisIssue(
            issue_id=test_issue.id,
            impact_rank=1,
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

    def test_analysis_issue_requires_issue_id(self, db_session, test_analysis):
        """Test that issue_id is required"""
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            impact_rank=1,
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

    def test_analysis_issue_requires_impact_rank(self, db_session, test_analysis, test_issue):
        """Test that impact_rank is required"""
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

    def test_analysis_issue_impact_rank_must_be_positive(self, db_session, test_analysis, test_issue):
        """Test that impact_rank must be >= 1"""
        analysis_issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_id=test_issue.id,
            impact_rank=0,  # Invalid - must be >= 1
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=analysis_issue, session=db_session)

