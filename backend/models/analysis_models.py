"""
Data models and schemas for the Golf Swing Analysis API

This module defines the structure of data that flows through the API,
including request validation and response formatting.
"""

from typing import List, Dict, Any, Optional

class DrillModel:
    """
    Model for a golf training drill
    """
    def __init__(self, title: str, description: str):
        self.title = title
        self.description = description
    
    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary for JSON serialization"""
        return {
            'title': self.title,
            'description': self.description
        }

class AnalysisResponseModel:
    """
    Model for the complete analysis response
    
    This matches the interface expected by the React frontend:
    - summary: Overall analysis text
    - drills: List of recommended training drills
    - keyframes: List of URLs to key moment images
    """
    def __init__(self, summary: str, drills: List[DrillModel], keyframes: List[str]):
        self.summary = summary
        self.drills = drills
        self.keyframes = keyframes
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'summary': self.summary,
            'drills': [drill.to_dict() for drill in self.drills],
            'keyframes': self.keyframes
        }

class VideoUploadModel:
    """
    Model for video upload validation
    """
    def __init__(self, filename: str, file_size: int, file_type: str):
        self.filename = filename
        self.file_size = file_size
        self.file_type = file_type
    
    def is_valid(self) -> bool:
        """
        Validate the uploaded video file
        """
        # Check file size (100MB max)
        if self.file_size > 100 * 1024 * 1024:
            return False
        
        # Check file type
        allowed_types = ['mp4', 'mov', 'avi', 'mkv']
        if not any(self.filename.lower().endswith(ext) for ext in allowed_types):
            return False
        
        return True
    
    def get_validation_errors(self) -> List[str]:
        """
        Get list of validation errors
        """
        errors = []
        
        if self.file_size > 100 * 1024 * 1024:
            errors.append("File size exceeds 100MB limit")
        
        allowed_types = ['mp4', 'mov', 'avi', 'mkv']
        if not any(self.filename.lower().endswith(ext) for ext in allowed_types):
            errors.append("File type not supported. Allowed types: mp4, mov, avi, mkv")
        
        return errors

def create_mock_analysis_response() -> AnalysisResponseModel:
    """
    Create a mock analysis response for testing
    """
    mock_drills = [
        DrillModel(
            title="Wall Drill",
            description="Stand with your back against a wall during practice swings. This helps maintain spine angle and prevents early extension by keeping your hips back."
        ),
        DrillModel(
            title="Swing Plane Trainer",
            description="Use an alignment stick or club laid across your shoulders during practice swings to feel the correct shoulder turn and swing plane."
        ),
        DrillModel(
            title="Impact Position Hold",
            description="Practice holding your impact position for 5 seconds to build muscle memory for proper body positions at contact."
        )
    ]
    
    mock_keyframes = [
        "https://example.com/frame1.jpg",
        "https://example.com/frame2.jpg",
        "https://example.com/frame3.jpg"
    ]
    
    mock_summary = ("Your swing shows good fundamentals with a few areas for improvement. "
                   "The main issue is early extension during the downswing, where your hips "
                   "move toward the ball. This reduces power and can cause inconsistent contact. "
                   "Your backswing plane is slightly steep, which contributes to an over-the-top "
                   "move. Focus on maintaining your spine angle and improving your swing plane "
                   "for better results.")
    
    return AnalysisResponseModel(
        summary=mock_summary,
        drills=mock_drills,
        keyframes=mock_keyframes
    )
