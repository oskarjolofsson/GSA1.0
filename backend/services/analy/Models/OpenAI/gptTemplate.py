import json
from dotenv import load_dotenv
import os
from openai import OpenAI

from services.analy.Models.model import Model
from services.file_handeling.Video_file import Video_file
from services.keyframes.Keyframes import Keyframes
from services.analy.Sports.sportInstructions import SportAnalysis

from abc import ABC, abstractmethod

import time

class GptTemplate(Model, ABC):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        
    
    def image_ids(self, keyframes: Keyframes) -> list[str]:
        return keyframes.open_ai_id(self.client)
    
    def format_content(self, ids: list[str], shape: str = "unsure", height: str = "unsure", misses: str = "unsure", extra: str = "") -> list[dict[str, str]]:
        final_prompt = f"""Here are the user's personal notes about their swing. 
        Use them as additional context only. 
        Do NOT blindly assume they are correct. 
        If their interpretation is wrong or incomplete, gently correct it in a supportive way.

        User's notes:
        wanted shape: {shape}
        wanted height: {height}
        Things that were bad with the result: {misses}
        Extra notes about the swing: {extra}
        """
        
        content = [{"type": "input_text", "text": final_prompt}]
        for id in ids:
            image_prompt = {"type": "input_image", "file_id": id}
            content.append(image_prompt)
        
        return content

    @abstractmethod
    def ai_analysis(self, content: list[dict[str, str]]):
        ...
    
    def analyze(self, video_file: Video_file, shape: str = "unsure", height: str = "unsure", misses: str = "unsure", extra: str = "") -> dict:
        t1 = time.time()
        # Format the prompt and get result
        keyframes = video_file.keyframes(20)     # <-- Decide how many keyframes here
        t2 = time.time()
        print(f"Extracted {20} keyframes in {t2 - t1:.2f} seconds")
        image_ids = self.image_ids(keyframes=keyframes)
        t3 = time.time()
        print(f"Assigned OpenAI IDs to {len(image_ids)} images in {t3 - t2:.2f} seconds")
        content = self.format_content(image_ids, shape=shape, height=height, misses=misses, extra=extra)
        t4 = time.time()
        print(f"Formatted content in {t4 - t3:.2f} seconds")
        
        # Delete image and video-files from memory
        keyframes.removeAll()
        video_file.remove()
        
        analysis = self.ai_analysis(content)
        t5 = time.time()
        print(f"AI analysis completed in {t5 - t4:.2f} seconds")

        # format result
        raw_text = analysis.output_text
        data = json.loads(raw_text)
        
        return data