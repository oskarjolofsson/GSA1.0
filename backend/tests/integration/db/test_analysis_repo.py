
from services.db.models.Analysis import Analysis
import uuid
from services.db.repositories.analysis import create_analysis, get_analysis_by_id
        
        
def test_create_mock_analysis(db_session, test_user):
    analysis = Analysis(
        user_id = str(test_user),
        model_version ="test-model-version"
    )
    
    create_analysis(analysis=analysis, session=db_session)
    
    # Fetch the analysis directly from the database to verify it was persisted
    fetched_analysis = get_analysis_by_id(analysis.id, session=db_session)
    
    db_session.commit()
    
    assert fetched_analysis is not None
    assert fetched_analysis.id == analysis.id
    assert fetched_analysis.user_id == analysis.user_id
    assert fetched_analysis.model_version == analysis.model_version
    assert fetched_analysis.status == "awaiting_upload"
    
    