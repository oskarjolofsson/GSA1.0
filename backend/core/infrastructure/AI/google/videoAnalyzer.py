import json
import time
from typing import Optional
from google import genai
from google.genai import types

from .prompts import VIDEO_SYSTEM_INSTRUCTIONS


def _format_user_prompt(
    shape: Optional[str] = None,
    height: Optional[str] = None,
    misses: Optional[str] = None,
    extra: Optional[str] = None
) -> str:
    """Format user context into a prompt string."""
    return f"""
Here are the user's personal notes about their swing.

Use these notes as context only.
Do NOT assume they are correct.
If they conflict with what you see, gently correct them in a supportive way.

User intent:
- Wanted ball shape: {shape if shape else "Not specified"}
- Wanted height: {height if height else "Not specified"}
- Actual result: {misses if misses else "Not specified"}

Extra notes:
{extra if extra else "None"}

Use this information only to:
- Cross-check ball flight
- Help rank swing issues by importance

Do not prioritize user assumptions over video evidence.
"""


def _upload_and_wait(client: genai.Client, video_path: str) -> genai.File:
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


def _build_content_payload(video_file: genai.File, user_prompt: str) -> list:
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
) -> genai.GenerateContentResponse:
    """Call Gemini API with the prepared content."""
    print(f"Calling Gemini API with model: {model}")
    
    response = client.models.generate_content(
        model=model,
        config=types.GenerateContentConfig(
            system_instruction=[{"text": VIDEO_SYSTEM_INSTRUCTIONS}],
            temperature=0.0,
            top_p=0.1,
            top_k=1
        ),
        contents=contents
    )
    
    return response


def _parse_response(response: genai.GenerateContentResponse) -> dict:
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
    model: str = "gemini-3-pro-preview"
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
        # Step 1: Upload video and wait for processing
        video_file = _upload_and_wait(client, video_path)
        
        # Step 2: Format user prompt
        user_prompt = _format_user_prompt(shape, height, misses, extra)
        
        # Step 3: Build content payload
        contents = _build_content_payload(video_file, user_prompt)
        
        # Step 4: Call Gemini API
        response = _call_gemini_api(client, contents, model)
        
        # Step 5: Parse response
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