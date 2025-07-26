from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Any
from pathlib import Path

class testAnalys:

    def __init__(self, uploads_folder: str):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        self.uploads_folder = uploads_folder


    def get_response(self) -> str:
        message_prompt = """
        You are an expert golf coach analyzing a complete golf swing through the images Ive uploaded.
        These images are in chronological order, showing the full motion from setup to follow-through.

        Based only on what you see, give me two concise drills that would most effectively improve my swing.
        Focus on form, timing, and mechanics. Keep your advice brief and actionable.
        """
        image_paths = self.get_paths_in_folder(self.uploads_folder)
        content = self.format_content(message_prompt ,image_paths)
        analysis = self.ai_analysis(content)
        return analysis
    

    def is_image_file(self, file_path: str) -> bool:
        image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        return os.path.splitext(file_path)[1].lower() in image_extensions
    

    def get_paths_in_folder(self, folder_path: str) -> list[str]:
        path = Path(folder_path)
        if not path.exists:
            raise FileNotFoundError(f"The path {folder_path} does not exist")
        
        path_list = []
        for file in path.iterdir():
            if not self.is_image_file(file):
                raise ValueError(f"{path} is not a valid image type")
            path_list.append(file)

        return path_list
    def format_content(self, prompt: str, paths: list[str]) -> list[dict[str, Any]]:
        content = [{"type": "input_text", "text": prompt}]
        for path in paths:
            image_prompt = {"type": "input_image", "file_id": self.create_fileid(path)}
            content.append(image_prompt)
        
        return content

    def create_fileid(self, path: str) -> str:
        with open(path, "rb") as file_content:
            result = self.client.files.create(
                file=file_content,
                purpose="vision",
            )
            return result.id

    def ai_analysis(self, content: list[dict[str, Any]]) -> str:
        response = self.client.responses.create(
            model="gpt-4.1",
            temperature=0.1,
            input=[
                {"role": "system", "content": "You are a world-class AI golf instructor providing visual feedback and training drills."},
                {"role": "user", "content": content,}
            ],
        )

        return response.output_text

if __name__ == "__main__":
    analys = testAnalys("backend/uploads/keyframes")
    print(analys.get_response())
