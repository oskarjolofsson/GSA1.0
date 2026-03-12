from ..models.PracticeSession import PracticeSession
from ..models.PracticeDrillRun import PracticeDrillRun
from ..models.PracticeRep import PracticeRep
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


# ---------------- PRACTICE REPS ----------------

def get_practice_rep_by_id(rep_id: UUID, session: Session) -> PracticeRep:
    return session.get(PracticeRep, rep_id)


def get_practice_reps_by_drill_run_id(drill_run_id: UUID, session: Session) -> list[PracticeRep]:
    return (
        session.query(PracticeRep)
        .filter(PracticeRep.drill_run_id == drill_run_id)
        .order_by(PracticeRep.rep_number)
        .all()
    )


def get_practice_reps_by_drill_run_and_success(
    drill_run_id: UUID, success: bool, session: Session
) -> list[PracticeRep]:
    return (
        session.query(PracticeRep)
        .filter(PracticeRep.drill_run_id == drill_run_id, PracticeRep.success == success)
        .all()
    )


def create_practice_rep(rep: PracticeRep, session: Session) -> PracticeRep:
    session.add(rep)
    session.flush()
    return rep


def create_practice_reps(reps: list[PracticeRep], session: Session) -> list[PracticeRep]:
    session.add_all(reps)
    session.flush()
    return reps


def update_practice_rep(rep: PracticeRep, session: Session) -> PracticeRep:
    session.add(rep)
    session.flush()
    return rep


def delete_practice_rep(rep: PracticeRep, session: Session) -> None:
    session.delete(rep)
    session.flush()
