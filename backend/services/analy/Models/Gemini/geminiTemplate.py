import json
from dotenv import load_dotenv
import os
import time
from google import genai

from services.analy.Models.model import Model
from services.file_handeling.Video_file import Video_file
from services.keyframes.Keyframes import Keyframes
from services.analy.Sports.sportInstructions import SportAnalysis

from pprint import pprint

from abc import ABC, abstractmethod

class GeminiTemplate(Model, ABC):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable not set.")
        
        self.client = genai.Client(api_key=api_key)
        
    
    def format_content(self, video, prompt: str) -> list[dict[str, str]]:
        final_prompt = """Here are the user's personal notes about their swing. 
        Use them as additional context only. 
        Do NOT blindly assume they are correct. 
        If their interpretation is wrong or incomplete, gently correct it in a supportive way.

        User's notes:""" + prompt
        
        content = [
            {"text": final_prompt},
            {"fileData": {"fileUri": video.uri}}
        ]
        
        return content

    @abstractmethod
    def ai_analysis(self, content: list[dict[str, str]]):
        ...
    
    def analyze(self, video_file: Video_file, prompt: str = ""):
        
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
        
        
        
        user_prompt_content = self.format_content(prompt=prompt, video=video)
        
        # Delete image and video-files from memory
        video_file.remove()
        
        analysis = self.ai_analysis(user_prompt_content)
        
        # Remove uploaded file from Gemini
        self.client.files.delete(name=video.name)

        # format result
        raw_text = analysis.text
        print("Raw Gemini Response:" + raw_text)
        data = json.loads(raw_text) # Make into dict
        
        pprint(data)
        
        return data