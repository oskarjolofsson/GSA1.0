from fastapi import APIRouter
router = APIRouter()

@router.post("/create")
def get_feedback():
    """
    Create an analysis and return a signed upload URL.

    Arguments (JSON body):
        user_id (str): ID of the authenticated user
        sport (str): Sport type (default: "golf")
        user_prompts (dict): User prompts for analysis

    Returns:
        JSON response with:
        - success
        - analysis_id
        - upload_url
    """
    pass


@router.post("/<analysis_id>/uploaded")
def run_analysis(analysis_id: str):
    """
    Confirm that the video upload has completed.
    Now the analysis processing can be triggered.

    Arguments:
        analysis_id (str): Analysis identifier

    Returns:
        JSON response with success status
    """
    pass

    
@router.get("/")   
def list_analyses():
    """
    List all analyses for the authenticated user.
    """
    pass


@router.get("/<analysis_id>")
def get_analysis(analysis_id: str):
    """
    Get details of a specific analysis.

    Arguments:
        analysis_id (str): Analysis identifier

    Returns:
        JSON response with analysis details
    """
    pass


@router.get("<analysis_id>/video-url")
def get_analysis_video_url(analysis_id: str):
    """
    Get a signed URL for downloading the original video associated with an analysis.

    Arguments:
        analysis_id (str): Analysis identifier

    Returns:
        JSON response with:
        - success
        - video_url
    """
    pass


@router.delete("/<analysis_id>")
def delete_analysis(analysis_id: str):
    """
    Delete a specific analysis and all associated data.

    Arguments:
        analysis_id (str): Analysis identifier

    Returns:
        JSON response with success status
    """
    pass