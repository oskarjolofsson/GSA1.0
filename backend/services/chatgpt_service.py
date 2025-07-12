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
from dotenv import load_dotenv

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
        
        #TODO - Configure request headers

        #TODO set up rate limiting if needed


    """
    Analyze a golf swing using ChatGPT API
    
    Args:
        video_metadata: Dictionary containing several images in the following format in order:
            - filename: Name of the image file
            - file_size: Size of the image file
            - any extracted features or descriptions
            - It comes with 12 images, each representing a key moment in the swing.
    
    Returns:
        AnalysisResponseModel: Structured analysis response
    
    TODO: Implement the following steps:
    1. Prepare the prompt for ChatGPT based on video metadata
    2. Make API call to OpenAI
    3. Parse the response from ChatGPT
    4. Extract summary, drills, and keyframe information
    5. Return structured AnalysisResponseModel
    6. Handle API errors (rate limits, authentication, etc.)
    """  
    def analyze_golf_swing(self, video_metadata: Dict[str, Any]) -> AnalysisResponseModel:
        
        pass

    

   