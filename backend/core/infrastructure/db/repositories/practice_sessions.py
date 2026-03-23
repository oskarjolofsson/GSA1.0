from ..models.PracticeSession import PracticeSession
from ..models.PracticeDrillRun import PracticeDrillRun
from sqlalchemy.orm import Session
from uuid import UUID


# ---------------- PRACTICE SESSIONS ----------------

def get_practice_session_by_id(session_id: UUID, session: Session) -> PracticeSession:
    return session.get(PracticeSession, session_id)


def get_practice_sessions_by_user_id(user_id: UUID, session: Session) -> list[PracticeSession]:
    return (
        session.query(PracticeSession)
        .filter(PracticeSession.user_id == user_id)
        .order_by(PracticeSession.started_at.desc())
        .all()
    )


def get_practice_sessions_by_user_and_status(
    user_id: UUID, status: str, session: Session
) -> list[PracticeSession]:
    return (
        session.query(PracticeSession)
        .filter(PracticeSession.user_id == user_id, PracticeSession.status == status)
        .order_by(PracticeSession.started_at.desc())
        .all()
    )
    

def get_practice_sessions_by_analysis_issue_id(analysis_issue_id: str, session: Session) -> list[PracticeSession]:
    return (
        session.query(PracticeSession)
        .filter(PracticeSession.analysis_issue_id == analysis_issue_id)
        .order_by(PracticeSession.started_at.desc())
        .all()
    )


def get_practice_sessions_by_analysis_issue_ids(analysis_issue_ids: list[str], session: Session) -> list[PracticeSession]:
    """Batch fetch practice sessions for multiple analysis issues in a single query."""
    return (
        session.query(PracticeSession)
        .filter(PracticeSession.analysis_issue_id.in_(analysis_issue_ids))
        .order_by(PracticeSession.analysis_issue_id, PracticeSession.started_at.desc())
        .all()
    )


def create_practice_session(practice_session: PracticeSession, session: Session) -> PracticeSession:
    session.add(practice_session)
    session.flush()
    return practice_session


def update_practice_session(practice_session: PracticeSession, session: Session) -> PracticeSession:
    session.add(practice_session)
    session.flush()
    return practice_session


def delete_practice_session(practice_session: PracticeSession, session: Session) -> None:
    session.delete(practice_session)
    session.flush()


# ---------------- PRACTICE DRILL RUNS ----------------

def get_practice_drill_run_by_id(drill_run_id: UUID, session: Session) -> PracticeDrillRun:
    return session.get(PracticeDrillRun, drill_run_id)


def get_practice_drill_runs_by_session_id(session_id: UUID, session: Session) -> list[PracticeDrillRun]:
    return (
        session.query(PracticeDrillRun)
        .filter(PracticeDrillRun.session_id == session_id)
        .order_by(PracticeDrillRun.order_index)
        .all()
    )
    
def get_practice_drill_runs_by_session_ids(session_ids: list[UUID], session: Session) -> list[PracticeDrillRun]:
    return (
        session.query(PracticeDrillRun)
        .filter(PracticeDrillRun.session_id.in_(session_ids))
        .order_by(PracticeDrillRun.session_id, PracticeDrillRun.order_index)
        .all()
    )


def get_practice_drill_runs_by_drill_id(drill_id: UUID, session: Session) -> list[PracticeDrillRun]:
    return (
        session.query(PracticeDrillRun)
        .filter(PracticeDrillRun.drill_id == drill_id)
        .all()
    )


def create_practice_drill_run(drill_run: PracticeDrillRun, session: Session) -> PracticeDrillRun:
    session.add(drill_run)
    session.flush()
    return drill_run


def update_practice_drill_run(drill_run: PracticeDrillRun, session: Session) -> PracticeDrillRun:
    session.add(drill_run)
    session.flush()
    return drill_run


def delete_practice_drill_run(drill_run: PracticeDrillRun, session: Session) -> None:
    session.delete(drill_run)
    session.flush()

