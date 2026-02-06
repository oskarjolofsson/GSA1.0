from ..models.Issue import Issue
from sqlalchemy.orm import Session

# ------------ GET ------------


def get_issue_by_id(issue_id, session: Session) -> Issue:
    return session.get(Issue, issue_id)


def get_all_issues(session: Session) -> list[Issue]:
    return session.query(Issue).all()


# ------------ CREATE ------------


def create_issue(issue: Issue, session: Session) -> Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ UPDATE ------------


def update_issue(issue: Issue, session: Session) -> Issue:
    session.add(issue)
    session.flush()
    return issue
