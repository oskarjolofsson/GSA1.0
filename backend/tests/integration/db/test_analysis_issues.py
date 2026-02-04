from services.db.models.AnalysisIssue import AnalysisIssue
from services.db.models.Analysis import Analysis
import uuid
from services.db.repositories.analysis_issues import (
    create_analysis_issue,
    get_analysis_issue_by_id,
)
from services.db.repositories.analysis import create_analysis
import pytest


@pytest.fixture
def test_analysis(db_session, test_user):
    """Create an analysis for testing"""
    analysis = Analysis(
        user_id=test_user,
        model_version="v1.0",
    )
    return create_analysis(analysis=analysis, session=db_session)


class TestAnalysisIssueCreate:
    """Tests for creating AnalysisIssue records"""

    def test_create_analysis_issue_with_required_fields(self, db_session, test_analysis):
        """Test creating an analysis issue with required fields"""
        # Create analysis issue
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            impact_rank=1,
        )

        created = create_analysis_issue(analysis_issue=issue, session=db_session)

        assert created.id is not None
        assert created.analysis_id == test_analysis.id
        assert created.issue_code == "ISSUE_001"
        assert created.impact_rank == 1
        assert created.phase is None
        assert created.severity is None

    def test_create_analysis_issue_with_all_fields(self, db_session, test_analysis):
        """Test creating an analysis issue with all optional fields"""
        # Create analysis issue
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            phase="BACKSWING",
            impact_rank=3,
            severity="MAJOR",
        )

        created = create_analysis_issue(analysis_issue=issue, session=db_session)

        assert created.id is not None
        assert created.analysis_id == test_analysis.id
        assert created.issue_code == "ISSUE_001"
        assert created.phase == "BACKSWING"
        assert created.impact_rank == 3
        assert created.severity == "MAJOR"

    def test_create_analysis_issue_persists_to_database(self, db_session, test_analysis):
        """Test that created issue is persisted to database"""
        # Create analysis issue
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            impact_rank=1,
        )

        create_analysis_issue(analysis_issue=issue, session=db_session)

        fetched_issue = get_analysis_issue_by_id(issue.id, session=db_session)

        assert fetched_issue is not None
        assert fetched_issue.id == issue.id
        assert fetched_issue.analysis_id == test_analysis.id
        assert fetched_issue.issue_code == "ISSUE_001"


class TestAnalysisIssueRead:
    """Tests for reading AnalysisIssue records"""

    def test_get_analysis_issue_by_id(self, db_session, test_analysis):
        """Test retrieving an analysis issue by ID"""
        # Create analysis issue
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            impact_rank=1,
        )
        created = create_analysis_issue(analysis_issue=issue, session=db_session)

        fetched = get_analysis_issue_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.issue_code == "ISSUE_001"

    def test_get_analysis_issue_by_id_not_found(self, db_session):
        """Test retrieving a non-existent analysis issue returns None"""
        non_existent_id = uuid.uuid4()

        result = get_analysis_issue_by_id(non_existent_id, session=db_session)

        assert result is None


class TestAnalysisIssueConstraints:
    """Tests for AnalysisIssue model constraints"""

    def test_analysis_issue_id_is_uuid(self, db_session, test_analysis):
        """Test that issue ID is a valid UUID"""
        # Create analysis issue
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            impact_rank=1,
        )
        created = create_analysis_issue(analysis_issue=issue, session=db_session)

        assert isinstance(created.id, uuid.UUID)

    def test_valid_phase_values(self, db_session, test_analysis):
        """Test all valid phase values"""
        valid_phases = ["SETUP", "BACKSWING", "TRANSITION", "DOWNSWING", "IMPACT", "FOLLOW_THROUGH"]

        for idx, phase in enumerate(valid_phases):
            issue = AnalysisIssue(
                analysis_id=test_analysis.id,
                issue_code=f"ISSUE_{phase}",
                phase=phase,
                impact_rank=idx + 1,
            )
            created = create_analysis_issue(analysis_issue=issue, session=db_session)
            assert created.phase == phase

    def test_analysis_issue_requires_analysis_id(self, db_session):
        """Test that analysis_id is required"""
        issue = AnalysisIssue(
            issue_code="ISSUE_001",
            impact_rank=1,
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=issue, session=db_session)

    def test_analysis_issue_requires_issue_code(self, db_session, test_analysis):
        """Test that issue_code is required"""
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            impact_rank=1,
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=issue, session=db_session)

    def test_analysis_issue_requires_impact_rank(self, db_session, test_analysis):
        """Test that impact_rank is required"""
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=issue, session=db_session)

    def test_analysis_issue_impact_rank_must_be_positive(self, db_session, test_analysis):
        """Test that impact_rank must be >= 1"""
        issue = AnalysisIssue(
            analysis_id=test_analysis.id,
            issue_code="ISSUE_001",
            impact_rank=0,  # Invalid - must be >= 1
        )

        with pytest.raises(Exception):
            create_analysis_issue(analysis_issue=issue, session=db_session)
