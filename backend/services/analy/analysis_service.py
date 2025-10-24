from services.keyframes.Keyframes import Keyframes
from services.file_handeling.Video_file import Video_file
from services.qualityCheck.VideoQuality import VideoQuality

from dotenv import load_dotenv
import os
from openai import OpenAI
from abc import ABC, abstractmethod
import json
from werkzeug.datastructures import FileStorage

class Analysis(ABC):
    def __init__(self):
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

    
    def get_response(self, video_FileStorage: FileStorage, prompt: str = "", start_time: float = None, end_time: float = None):
        video_file = Video_file(video_FileStorage)

        # Trim video if start and end times are provided
        if start_time is not None and end_time is not None:
            video_file.trim(start_time, end_time)

        q = VideoQuality(video_file)
        if not q.validate():
            raise ValueError("\n".join(q.issues()))

        # Format the prompt and get result
        keyframes = video_file.keyframes(1)     # <-- Decide how many keyframes here
        image_ids = self.image_ids(keyframes=keyframes)
        content = self.format_content(image_ids, prompt=prompt)
        analysis = self.ai_analysis(content, system_instructions=self.system_instructions())

        # format result
        raw_text = analysis.output_text
        data = json.loads(raw_text)
        
        print(data)
        
        # Delete image and video-files from memory
        keyframes.removeAll()
        video_file.remove()

        # Returns a formated dict that can be directly returned
        return data


    @abstractmethod
    def system_instructions(self) -> str:
        ...

# Different sports bellow

class GolfAnalysis(Analysis):
    def __init__(self):
        super().__init__()

    def system_instructions(self) -> str:
        system_prompt = """You are an expert golf coach analyzing a swing shown in the images. 

        Return your analysis only as valid JSON with the following structure:

        {
        "summary": "string",
        "drills": ["string", "string"],
        "observations": ["string", "string", "..."],
        "phase_notes": {
            "setup": "string",
            "backswing": "string",
            "transition": "string",
            "impact": "string",
            "finish": "string"
            }
        }

        Instructions for each field:
        - "summary": Write a brief, high-level overview of the swings main strengths and weaknesses in 1 to 2 sentences. Keep it concise and balanced.
        - "drills": Provide exactly two specific, actionable drills the player can practice. Write them as short, clear coaching cues.
        - "observations": List 3 to 5 short technical notes you noticed (e.g., posture, grip, weight transfer). Each should be a single, simple sentence.
        - "phase_notes": Give one short sentence of feedback for each swing phase ("setup", "backswing", "transition", "impact", "finish"). Be direct and specific to that phase.

        Rules:
        - Do not include anything outside the JSON object (no extra text, no explanations).
        - All values must be strings.
        - Ensure the JSON is valid and can be parsed directly with json.loads()."""
        return system_prompt
    
# Single instance of main method of class
def get_response(video_FileStorage: FileStorage, prompt: str = "", start_time: float = None, end_time: float = None):
    return GolfAnalysis().get_response(video_FileStorage, prompt, start_time, end_time)