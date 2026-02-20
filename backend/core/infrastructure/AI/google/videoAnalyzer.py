import json
import time
from typing import Optional
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from .prompts import VIDEO_SYSTEM_INSTRUCTIONS2, format_content

from ...db.repositories.issues import get_all_issues

class MetaData(BaseModel):
    camera_view: str = Field(..., description="Camera view of the swing (unknown | face_on | down_the_line)")
    club_type: str = Field(..., description="Type of club used in the swing (unknown | driver | iron | wedge)")

class AnalysisResponse(BaseModel):
    metadata: MetaData
    issues: list = Field(default_factory=list)
    success: bool = Field(..., description="Indicates if the analysis was successful")


def _upload_and_wait(client: genai.Client, video_path: str) -> types.File:
    """Upload video to Gemini and wait for processing to complete."""
    print(f"Uploading video: {video_path}")
    video_file = client.files.upload(file=video_path)
    
    # Poll until file is ACTIVE
    while True:
        file_status = client.files.get(name=video_file.name)
        if file_status.state == "ACTIVE":
            print(f"Video processing complete: {video_file.name}")
            break
        elif file_status.state == "FAILED":
            raise Exception(f"Video processing failed: {file_status.error_message if hasattr(file_status, 'error_message') else 'Unknown error'}")
        time.sleep(0.5)
    
    return video_file


def _build_content_payload(video_file: types.File, user_prompt: str) -> list:
    """Build the content payload for the API request."""
    return [{
        "role": "user",
        "parts": [
            {"text": user_prompt},
            {"fileData": {"fileUri": video_file.uri}}
        ]
    }]


def _call_gemini_api(
    client: genai.Client,
    contents: list,
    model: str = "gemini-3-pro-preview"
) -> types.GenerateContentResponse:
    """Call Gemini API with the prepared content."""
    print(f"Calling Gemini API with model: {model}")
    
    response = client.models.generate_content(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=[{"text": VIDEO_SYSTEM_INSTRUCTIONS2}],
            temperature=0.0,
            top_p=0.1,
            top_k=1,
            response_mime_type="application/json",
            response_json_schema=AnalysisResponse.model_json_schema()
        ),
        contents=contents
    )
    
    return response


def _parse_response(response: types.GenerateContentResponse) -> dict:
    """Parse and validate the API response."""
    if not response or not response.text:
        raise ValueError("No response returned from Gemini API")
    
    raw_text = response.text.strip()
    
    if not raw_text:
        raise ValueError("Empty response from Gemini API")
    
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON response: {raw_text[:200]}")
        raise ValueError(f"Failed to parse JSON response: {str(e)}")
    
    return data


def analyze_video(
    client: genai.Client,
    video_path: str,
    shape: Optional[str] = None,
    height: Optional[str] = None,
    misses: Optional[str] = None,
    extra: Optional[str] = None,
    model: str = "gemini-3-pro-preview",
    db_session = None
) -> dict:
    """
    Analyze a golf swing video using Google Gemini.
    
    Args:
        client: Initialized Gemini client
        video_path: Local path to the video file
        shape: Wanted ball shape (optional)
        height: Wanted ball height (optional)
        misses: Actual result/miss pattern (optional)
        extra: Additional user notes (optional)
        model: Gemini model to use (default: gemini-3-pro-preview)
    
    Returns:
        dict: Parsed analysis results
    
    Raises:
        ValueError: If response is invalid or empty
        Exception: If video processing fails
    """
    video_file = None
    
    try:
        # Upload video and wait for processing
        video_file = _upload_and_wait(client, video_path)
        
        # Get list of all issues in database
        if not db_session:
            raise ValueError("Database session is required to retrieve issues")
        issues = get_all_issues(db_session) 
        issues = [ {
            "issue_id": str(issue.id), 
            "name": issue.title, 
            "current motion": issue.current_motion, 
            "expected motion": issue.expected_motion
        } for issue in issues ] if issues else []
        
        # Format user prompt
        user_prompt = format_content(shape=shape, height=height, misses=misses, extra=extra, issue_list=issues)
        
        # Build content payload
        contents = _build_content_payload(video_file, user_prompt)
        
        # Call Gemini API
        response = _call_gemini_api(client, contents, model)
        
        # Parse response
        result = _parse_response(response)
        
        return result
        
    finally:
        # Cleanup: Delete uploaded file from Gemini
        if video_file:
            try:
                client.files.delete(name=video_file.name)
                print(f"Deleted uploaded file: {video_file.name}")
            except Exception as e:
                print(f"Warning: Failed to delete uploaded file: {str(e)}")