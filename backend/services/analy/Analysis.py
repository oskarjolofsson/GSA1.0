from services.keyframes.Keyframes import Keyframes

from dotenv import load_dotenv
import os
from openai import OpenAI
from abc import ABC, abstractmethod
import json

class Analysis(ABC):
    def __init__(self, keyframes: Keyframes, prompt: str = ""):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        self.keyframes = keyframes
        self.prompt = prompt

    def image_ids(self) -> list[str]:
        return self.keyframes.open_ai_id(self.client)
    
    def format_content(self, ids: list[str]) -> list[dict[str, str]]:
        content = [{"type": "input_text", "text": self.prompt}]
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
    
    def get_response(self):
        image_ids = self.image_ids()
        content = self.format_content(image_ids)
        ai_analysis = self.ai_analysis(content, self.system_instructions())

        raw_text = ai_analysis.output_text
        data = json.loads(raw_text)

        return data
    
    @abstractmethod
    def system_instructions(self) -> str:
        ...

# Different sports bellow

class GolfAnalysis(Analysis):
    def __init__(self, keyframes: Keyframes, prompt: str = ""):
        super().__init__(keyframes, prompt)

    def system_instructions(self) -> str:
        instructions = """
        You are an expert golf coach analyzing a swing shown in the images. 
        Please return your analysis in the following structure:

        1. **Summary** . A brief, high-level summary of the swings strengths and weaknesses.
        2. **Drills** - Two specific and actionable drills to address the main issues.
        3. **Observations** - Technical details you noticed (e.g., posture, grip, weight transfer).
        4. **Phase Notes** (optional) - If relevant, note specific swing phases (backswing, impact, etc.).

        Keep it clear and brief — this is going into a training app.
        Respond using specifically the following structure:
        - "summary": string
        - "drills": list of 2 strings
        - "observations": list of strings
        - "phase_notes": dictionary with keys the keys: setup, backswing, transition, impact, finish.

        Do not include any explanation or formatting outside the structure specified.
        """
        return instructions