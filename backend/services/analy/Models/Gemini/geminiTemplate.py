import json
from dotenv import load_dotenv
import os
import time
from google import genai

from services.analy.Models.model import Model
from services.file_handeling.Video_file import Video_file
from services.keyframes.Keyframes import Keyframes
from services.analy.Sports.sportInstructions import SportAnalysis

from abc import ABC, abstractmethod

class GeminiTemplate(Model, ABC):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable not set.")
        
        self.client = genai.Client(api_key=api_key)
        
    
    def format_content(self, shape: str = None, height: str = None, misses: str = None, extra: str = None) -> str:
        final_prompt = f"""
        Here are the user’s personal notes about their swing.

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
        return final_prompt
        
        
        
        return final_prompt

    @abstractmethod
    def ai_analysis(self, content: list[dict[str, str]]):
        ...
    
    def analyze(self, video_file: Video_file, shape: str = "unsure", height: str = "unsure", misses: str = "unsure", extra: str = "") -> dict:
        
        # Upload video to Gemini
        video = self.client.files.upload(file=video_file.path())
        
        # Wait until ACTIVE
        while True:
            file_status = self.client.files.get(name=video.name)
            if file_status.state == "ACTIVE":
                break
            elif file_status.state == "FAILED":
                raise Exception(f"File processing failed: {file_status.error_message}")
            time.sleep(0.5)
            
        # Delete image and video-files from memory
        video_file.remove()
        
        user_prompt_content = self.format_content(shape=shape, height=height, misses=misses, extra=extra)
       
        analysis = self.ai_analysis(user_prompt_content, video)
        
        # Remove uploaded file from Gemini
        self.client.files.delete(name=video.name)
        
        if not analysis or not analysis.text:
            raise ValueError("No analysis returned from AI model.")

        # format result
        raw_text = analysis.text if hasattr(analysis, 'text') else str(analysis)
        raw_text = raw_text.strip()
        
        # Debug: Log what we got
        if not raw_text:
            print(f"ERROR: Empty response from API")
            raise ValueError("AI analysis returned empty response")
        
        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON response: {raw_text[:200]}")
            raise
        
        return data