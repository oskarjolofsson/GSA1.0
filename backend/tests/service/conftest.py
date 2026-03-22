import uuid
import pytest
from sqlalchemy import text
from ...core.infrastructure.db.engine import engine
from ...core.infrastructure.db.session import SessionLocal
from ...core.infrastructure.storage.r2Adaptor import delete
from ...core.infrastructure.db.repositories.analysis import get_analysis_by_id as get_analysis_by_id_in_db
from datetime import timedelta
from ...core.services.analysis_service import create_analysis, run_analysis
from ...core.services.dtos.analysis_service_dto import CreateAnalysisDTO, RunAnalysisDTO
import requests


# ---------- Slow/shared fixtures (for run-analysis class only) ----------

@pytest.fixture(scope="session")
def shared_connection():
    conn = engine.connect()
    tx = conn.begin()  # one outer tx for whole session
    try:
        yield conn
    finally:
        tx.rollback()   # clean all shared writes at end of test session
        conn.close()


@pytest.fixture(scope="session")
def shared_db_session(shared_connection):
    session = SessionLocal(bind=shared_connection)
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="class")
def completed_analysis_shared(test_user, shared_db_session):
    """
    Run expensive analysis exactly once per TestRunAnalysis class.
    """

    create_result = create_analysis(
        CreateAnalysisDTO(
            user_id=test_user["user_id"],
            model="gemini-3-pro-preview",
            start_time=timedelta(seconds=0),
            end_time=timedelta(seconds=10),
        ),
        db_session=shared_db_session
    )
    analysis_id = create_result["analysis_id"]
    url = create_result["upload_url"]
    
    # Upload dummy video data to the pre-signed URL (simulate client upload)
    with open("uploads/video/golf.mp4", "rb") as f:
        video_data = f.read()
    requests.put(url, data=video_data)

    run_analysis(
        RunAnalysisDTO(
            analysis_id=analysis_id,
            user_id=test_user["user_id"],
        ),
        db_session=shared_db_session
    )
    
    # Get video key from db and delete the uploaded video from R2 to clean up after test
    analysis = get_analysis_by_id_in_db(analysis_id=analysis_id, session=shared_db_session)
    video_key = analysis.video.video_key
    delete(video_key)
    
    return analysis_id
