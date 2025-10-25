import json
from dotenv import load_dotenv
import os
from openai import OpenAI

from services.analy.Models.model import Model
from services.file_handeling.Video_file import Video_file
from services.keyframes.Keyframes import Keyframes
from services.analy.Sports.sportInstructions import SportAnalysis

class Gpt5AnalysisService(Model):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        
    
    def image_ids(self, keyframes: Keyframes) -> list[str]:
        return keyframes.open_ai_id(self.client)
    
    def format_content(self, ids: list[str], prompt: str) -> list[dict[str, str]]:
        content = [{"type": "input_text", "text": prompt}]
        for id in ids:
            image_prompt = {"type": "input_image", "file_id": id}
            content.append(image_prompt)
        
        return content

    def ai_analysis(self, content: list[dict[str, str]], system_instructions: str):
        # Response is a string response
        response = self.client.responses.create(
            model="gpt-5",
            input=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": content,}
            ],
        )
        return response
    
    def analyze(self, video_file: Video_file, prompt: str = ""):
        # Format the prompt and get result
        keyframes = video_file.keyframes(15)     # <-- Decide how many keyframes here
        image_ids = self.image_ids(keyframes=keyframes)
        content = self.format_content(image_ids, prompt=prompt)
        analysis = self.ai_analysis(content, 
                                    system_instructions=self.system_instructions.get()
                                    )

        # format result
        raw_text = analysis.output_text
        data = json.loads(raw_text)
        
        # Delete image and video-files from memory
        keyframes.removeAll()
        video_file.remove()
        
        return data