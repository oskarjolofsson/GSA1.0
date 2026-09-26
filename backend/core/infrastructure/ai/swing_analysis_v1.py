"""v1 swing analysis: a video and the golfer's free-text notes, matched against a flat
list of issues. Replaced by the law-first v2 flow; delete this module with the v1 API.

Takes the issue list as plain data. The caller loads it, scoped to the catalog plus the
caller's own custom issues; this module never touches the database.
"""

import json
from typing import Optional

from pydantic import BaseModel, Field

from . import gemini

RETURN_FORMAT = {
    "metadata": {
        "camera_view": "unknown | face_on | down_the_line",
        "club_type": "unknown | driver | iron | wedge"
    },
    "issues": [
        {
            "issue_id": "string",
            "confidence": 0.0
        }
    ],
    "success": True
}


SYSTEM_INSTRUCTIONS = f"""
You are a professional golf coach and structured swing analysis engine.
Your task is to analyze a golf swing video and identify issues from a predefined list.

CRITICAL RULES:

1. ISSUE SELECTION:
   - You MUST ONLY select issues from the provided predefined list
   - Each issue has a specific issue_id
   - Do NOT invent, create, or suggest new issues
   - Do NOT modify issue descriptions
   - If you see a problem not in the list, do not include it

2. CONFIDENCE SCORING:
   - Assign a confidence score between 0.0 and 1.0 for each identified issue
   - 0.0 = not visible or not present
   - 0.3-0.5 = possibly present but unclear
   - 0.6-0.8 = likely present with reasonable visibility
   - 0.9-1.0 = clearly visible and certain
   - Lower confidence instead of guessing
   - Only include issues with confidence ≥ 0.5
   
3. SUCCESS CRITERIA:
   - The analysis is successful if you can identify at least one issue with confidence ≥ 0.5
   - If no issues are clearly visible, return an empty issues array but still indicate success
   - If there is any problem with the video or analysis process, return success: false and an empty issues array

3. ANALYSIS PROCESS (INTERNAL — DO NOT OUTPUT):
   - Watch the entire swing video carefully
   - Compare visible motions against the predefined issue descriptions
   - Identify which issues from the list match what you observe
   - Assign confidence based on visibility and clarity
   - Rank issues by impact on ball flight and consistency
   - Select only the most impactful issues (maximum 2)

OUTPUT RULES (STRICT):

- Output MUST be valid raw JSON
- No markdown formatting (no ```)
- No explanations or commentary
- No text outside the JSON structure
- The response MUST start with {{ and end with }}
- Use exact issue_id values from the provided list
- Do NOT add extra fields
- No "```json``` or similar formatting

MANDATORY OUTPUT FORMAT:

Return ONLY this exact JSON structure:

{json.dumps(RETURN_FORMAT, indent=4)}

CONSTRAINTS (HARD):

- Maximum 2 issues total
- Only include issues with confidence ≥ 0.5
- Only use issue_id values from the predefined list
- confidence must be a number between 0.0 and 1.0
- All issue_id values must exactly match the provided list
- If no issues are clearly visible, return an empty issues array

Failure to follow any rule is an error.
"""


class MetaData(BaseModel):
    camera_view: str = Field(..., description="Camera view of the swing (unknown | face_on | down_the_line)")
    club_type: str = Field(..., description="Type of club used in the swing (unknown | driver | iron | wedge)")


class AnalysisResponse(BaseModel):
    metadata: MetaData
    issues: list = Field(default_factory=list)
    success: bool = Field(..., description="Indicates if the analysis was successful")


def format_content(
    shape: str = None,
    height: str = None,
    misses: str = None,
    extra: str = None,
    issue_list: list[dict] = None
) -> str:
    issues_block = (
        json.dumps(issue_list, indent=2)
        if issue_list
        else "[]"
    )

    final_prompt = f"""
        Here are the user’s personal notes about their swing.

        Use these notes as context only.
        Do NOT assume they are correct.
        If they conflict with what you see, gently correct them in a supportive way.

        User intent:
        - Wanted ball shape: {shape or "Not specified"}
        - Wanted height: {height or "Not specified"}
        - Actual result: {misses or "Not specified"}

        Extra notes:
        {extra or "None"}

        --------------------------------
        ALLOWED SWING ISSUES (STRICT LIST)
        --------------------------------
        You may ONLY select issues from the list below.
        Do NOT invent, rename, or merge issues.

        {issues_block}

        Use this list to:
        - Select applicable swing issues
        - Rank them by importance
        - Assign confidence scores

        Do not prioritize user assumptions over video evidence.
    """
    return final_prompt


def analyze_video(
    *,
    video_path: str,
    issues: list[dict],
    model: str,
    shape: Optional[str] = None,
    height: Optional[str] = None,
    misses: Optional[str] = None,
    extra: Optional[str] = None,
) -> dict:
    """Analyze a golf swing video against `issues` and return Gemini's parsed answer.

    `issues` is what the model may choose from, one dict per issue with its id, name,
    motions and description. Raises AIError subclasses from the gemini module.
    """
    prompt = format_content(shape=shape, height=height, misses=misses, extra=extra, issue_list=issues)
    with gemini.uploaded_video(video_path) as video:
        return gemini.generate_json(
            model=model,
            system_instruction=SYSTEM_INSTRUCTIONS,
            contents=[{"role": "user", "parts": [{"text": prompt}, gemini.video_part(video)]}],
            schema=AnalysisResponse.model_json_schema(),
        )
