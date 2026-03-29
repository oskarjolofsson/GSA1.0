from core.infrastructure.db import models
from core.infrastructure.db.repositories import issues as issues_repo
from core.infrastructure.db.repositories import analysis_issues as analysis_issues_repo
from core.infrastructure.db.repositories import analysis as analysis_repo
from core.services import analysis_service
from core.services import exceptions
import pytest

from sqlalchemy.orm import Session
from uuid import UUID
from dataclasses import dataclass

@dataclass
class AnalysisTestObject:
    analysis: models.Analysis
    analysis_issues: list[models.AnalysisIssue]


def test_delete_analysis_issues(test_user, db_session):
    to: AnalysisTestObject = create_analysis_and_analysis_issues(db_session, test_user["user_id"])
    
    # Delete one analysis_issue
    analysis_service.delete_analysis_issue(analysis_issue_id=to.analysis_issues[0].id, db_session=db_session, user_id=test_user["user_id"])
    
    # Make sure that thay are all still there, but that one of them is inactive
    fetched_analysis_issue0: models.AnalysisIssue = analysis_issues_repo.get_analysis_issue_by_id(to.analysis_issues[0].id, db_session)
    assert fetched_analysis_issue0 is not None
    assert fetched_analysis_issue0.active == False
    
    fetched_analysis_issue1: models.AnalysisIssue = analysis_issues_repo.get_analysis_issue_by_id(to.analysis_issues[1].id, db_session)
    assert fetched_analysis_issue1 is not None
    assert fetched_analysis_issue1.active == True
    
    # Make sure that the analysis_issue that is inactive is not fetched when asking via analysis_id
    fetched_analysis_issue_list: list[models.AnalysisIssue] = analysis_issues_repo.get_analysis_issues_by_analysis_id(to.analysis.id, db_session)
    assert len(fetched_analysis_issue_list) == 2


def test_delete_analysis_and_cascade(test_user, db_session):
    to: AnalysisTestObject = create_analysis_and_analysis_issues(db_session, test_user["user_id"])
    
    analysis_service.delete_analysis(to.analysis.id, db_session=db_session)
    
    with pytest.raises(exceptions.NotFoundException):
        assert analysis_service.get_analysis_by_id(analysis_id=to.analysis.id, db_session=db_session)
    
    with pytest.raises(exceptions.NotFoundException):
        assert analysis_service.get_analysis_issues(analysis_id=to.analysis.id, db_session=db_session)
        
    assert analysis_issues_repo.get_analysis_issues_by_analysis_id(to.analysis.id, session=db_session) == []
    

def test_delete_one_analysis_issue_and_all_other_should_also_be_dissableed(test_user, db_session):
    to1: AnalysisTestObject = create_analysis_and_analysis_issues(db_session, test_user["user_id"])
    to2: AnalysisTestObject = create_analysis_and_analysis_issues(db_session, test_user["user_id"])
    
    analysis_service.delete_analysis_issue(to1.analysis_issues[0].id, db_session=db_session, user_id=test_user["user_id"])
    
    assert to1.analysis_issues[0].active == False
    assert to1.analysis_issues[1].active == True
    assert to1.analysis_issues[2].active == True
    
    assert to2.analysis_issues[0].active == False
    assert to2.analysis_issues[1].active == True
    assert to2.analysis_issues[2].active == True
    
    
def test_get_unused_issues_of_user_id(test_user, db_session):
    to: AnalysisTestObject = create_analysis_and_analysis_issues(db_session, test_user["user_id"])
    created_issues: list[models.Issue] = issues_repo.get_issues_by_user_id(test_user["user_id"], session=db_session)
    assert len(created_issues) > 0
    
    all_issues : list[models.Issue] = issues_repo.get_all_issues(session=db_session)
    remain_issues: list[models.Issue] = issues_repo.get_unused_issues_of_user_id(test_user["user_id"], db_session)
    assert len(remain_issues) == len(all_issues) - len(created_issues)
    assert set(created_issues).isdisjoint(remain_issues)
    
    
def test_get_unused_issues_of_user_id_with_no_issues(test_user, db_session):
    remain_issues: list[models.Issue] = issues_repo.get_unused_issues_of_user_id(test_user["user_id"], db_session)
    all_issues : list[models.Issue] = issues_repo.get_all_issues(session=db_session)
    
    assert len(remain_issues) == len(all_issues)
    
    
    

# =================== Helper Methods ====================


def create_analysis_and_analysis_issues(session: Session, user_id: UUID) -> AnalysisTestObject:
    analysis: models.Analysis = models.Analysis(
        user_id=user_id,
        model_version="test_model",
        status="completed",
        success=True,
    )

    # persist first so analysis.id is available
    analysis_repo.create_analysis(analysis=analysis, session=session)
    session.flush()

    all_issues: list[models.Issue] = issues_repo.get_all_issues(session=session)
    if len(all_issues) < 3:
        raise ValueError("Need at least 3 issues in DB")

    analysis_issue1 = models.AnalysisIssue(
        analysis_id=analysis.id,
        issue_id=all_issues[0].id,
        confidence=0.8,
    )
    analysis_issue2 = models.AnalysisIssue(
        analysis_id=analysis.id,
        issue_id=all_issues[1].id,
        confidence=0.85,
    )
    analysis_issue3 = models.AnalysisIssue(
        analysis_id=analysis.id,
        issue_id=all_issues[2].id,
        confidence=0.9,
    )

    for ai in [analysis_issue1, analysis_issue2, analysis_issue3]:
        analysis_issues_repo.create_analysis_issue(analysis_issue=ai, session=session)

    session.flush()

    return AnalysisTestObject(
        analysis=analysis,
        analysis_issues=[analysis_issue1, analysis_issue2, analysis_issue3],
    )