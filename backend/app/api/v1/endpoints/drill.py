from fastapi import APIRouter, Depends, HTTPException
router = APIRouter()


@router.post("/create")
def create_drill():
    """
    Create a new drill.

    Arguments (JSON body):
        title (str): Title of the drill
        task (str): Description of the drill task
        success_signal (str): Description of what indicates a successful drill
        fault_indicator (str): Description of what indicates a failed drill 
        
    Returns:
        JSON response with:
        - success
        - drill_id
    """
    pass


@router.get("/<drill_id>")
def get_drill(drill_id: str):
    """
    Get details of a specific drill.

    Arguments:
        drill_id (str): Drill identifier

    Returns:
        JSON response with drill details
    """
    pass


@router.get("/by-analysis/<analysis_id>")
def get_drills_by_analysis(analysis_id: str):
    """
    Get all drills associated with a specific analysis.

    Arguments:
        analysis_id (str): Analysis identifier

    Returns:
        JSON response with a list of drills
    """
    pass


@router.get("/by-issue/<issue_id>")
def get_drills_by_issue(issue_id: str):
    """
    Get all drills associated with a specific issue.

    Arguments:
        issue_id (str): Issue identifier

    Returns:
        JSON response with a list of drills
    """
    pass


@router.get("/by-user/<user_id>")
def get_drills_by_user(user_id: str):
    """
    Get all drills associated with a specific user.

    Arguments:
        user_id (str): User identifier

    Returns:
        JSON response with a list of drills
    """
    pass

# ONLY FOR INTERNAL USE, NOT EXPOSED TO FRONTEND AND PROTECTED BY AUTHENTICATION
@router.put("/<drill_id>")
def update_drill(drill_id: str):
    """
    Update an existing drill.

    Arguments:
        drill_id (str): Drill identifier

    JSON body:
        title (str, optional): Updated title of the drill
        task (str, optional): Updated description of the drill task
        success_signal (str, optional): Updated description of what indicates a successful drill
        fault_indicator (str, optional): Updated description of what indicates a failed drill 

    Returns:
        JSON response with updated drill details
    """
    pass


# ONLY FOR INTERNAL USE, NOT EXPOSED TO FRONTEND AND PROTECTED BY AUTHENTICATION
@router.delete("/<drill_id>")
def delete_drill(drill_id: str):
    """
    Delete a specific drill.

    Arguments:
        drill_id (str): Drill identifier

    Returns:
        JSON response with success status
    """
    pass
