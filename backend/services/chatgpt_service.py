"""
ChatGPT API Service for Golf Swing Analysis

This service handles communication with the OpenAI ChatGPT API to analyze golf swing videos.
It's responsible for:
1. Preparing prompts for the AI
2. Making API calls to OpenAI
3. Processing and structuring the AI response
4. Handling API errors and rate limits
"""

import os
import requests
from typing import Dict, Any, List
from models.analysis_models import AnalysisResponseModel, DrillModel
from video_service import VideoProcessingService as vps
from dotenv import load_dotenv
from openai import OpenAI

class ChatGPTService:
    """
    Service class for interacting with the OpenAI ChatGPT API
    """
    
    def __init__(self):
        # Init the service and load environment variables
        load_dotenv()
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("API key not found. Please set OPENAI_API_KEY in your environment variables.")
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }


    def analyze_golf_swing(self, video_metadata: Dict[str, Any]) -> AnalysisResponseModel:
        # Prepare the prompt for ChatGPT based on video metadata
        prompt = "give the golfer 2 drills to improve the swing, and motivate your choice of drill"

        # Make API call to OpenAI
        response = self._call_openai_api(prompt, video_metadata)

        # Parse the response from ChatGPT
        analysis_data = self._parse_response(response)

        # Extract summary, drills, and keyframe information
        summary = analysis_data.get("summary", "")
        drills = [
            DrillModel(title=drill.get("title", ""), description=drill.get("description", ""))
            for drill in analysis_data.get("drills", [])
        ]
        keyframes = analysis_data.get("keyframes", [])

        # Return structured AnalysisResponseModel
        return AnalysisResponseModel(summary=summary, drills=drills, keyframes=keyframes)

    def _call_openai_api(self, prompt: str, video_metadata: dict) -> Dict[str, Any]:
        # Create client
        client = OpenAI(self.api_key)

        # Get the image paths
        

    # def _parse_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
    #     # TODO: Implement logic for parsing the response from ChatGPT
    #     return {":"}
    

if __name__ == "__main__" :
    metadata = {"filename": ""}

    service = ChatGPTService()