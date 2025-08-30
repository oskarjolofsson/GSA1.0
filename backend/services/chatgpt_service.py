"""
ChatGPT API Service for Golf Swing Analysis

This service handles communication with the OpenAI ChatGPT API to analyze golf swing videos.
It's responsible for:
1. Preparing prompts for the AI
2. Making API calls to OpenAI
3. Processing and structuring the AI response
4. Handling API errors and rate limits
"""

from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Any
from pathlib import Path
import json
import pprint   # For debugging
from services.video_service import VideoProcessingService
    

class ChatGPT_service:

    def __init__(self, uploads_folder: str, video_path: str, message_prompt: str):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        self.uploads_folder = uploads_folder
        self.video_path = video_path
        self.message_prompt = message_prompt


    def process_video(self) -> dict:
        """
        Process a video to extract its metadata and keyframes.

        Args:
        video_path (str): The path to the video file to process.

        Returns:
        dict: A dictionary containing video metadata and keyframe paths.
        """

        # Check if video file exists
        if not os.path.exists(self.video_path):
            raise FileNotFoundError(f"Video file not found: {self.video_path}")

        # print(f"Processing video: {os.path.basename(self.video_path)}")

        # Initialize Video Processing Service
        video_service = VideoProcessingService(self.uploads_folder)

        # Extract metadata and keyframes
        metadata = video_service.create_video_metadata(self.video_path, 10)

        print("\n📊 Extracted Metadata:")
        print(f"  • Filename: {metadata['filename']}")
        print(f"  • Duration: {metadata['duration']} seconds")
        print(f"  • Resolution: {metadata['resolution']}")
        print(f"  • FPS: {metadata['fps']}")
        print(f"  • File Size: {metadata['file_size']} bytes")
        print(f"  • Keyframes Extracted: {metadata['num_keyframes_extracted']}")

        print("\n🖼️ Keyframe Paths:")
        for i, keyframe_path in enumerate(metadata['keyframes']):
            print(f"  {i+1}. {keyframe_path}")

        print("\n✅ Video processing completed successfully!")
        print()

        return metadata


    def get_response(self) -> str:
        """
        Get results

        Returns:
        response: response object
        """

        # Create metadata from video
        self.process_video()
        # Get the paths to all individual images in the uploads_folder
        print("Image paths created from following folder: " + self.uploads_folder)
        print()
        image_paths = self.get_paths_in_folder(self.uploads_folder)
        # Format the prompt for the gpt api
        content = self.format_content(self.message_prompt ,image_paths)
        # Gather the final analysis in json format
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
        system_instructions = """
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
        - "phase_notes": dictionary with keys like "setup", "impact", etc., each mapping to a string.

        Do not include any explanation or formatting outside the structure specified.
        """

        print("Content:")
        print(content)

        # Response is a string response
        response = self.client.responses.create(
            model="gpt-5",
            input=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": content,}
            ],
        )

        # Return response-object
        return response