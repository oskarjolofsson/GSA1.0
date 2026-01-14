import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
import io
import base64
import requests

from services.cloudflare.videoStorageService import video_storage_service

class GeminiDrillImage:
    
    def __init__(self, 
                 fault_indicator: str, 
                 success_signal: str, 
                 task: str, 
                 title: str, 
                 try_this: str, 
                 what_you_did: str, 
                 why_it_matters: str,
                 ):
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable not set.")
        
        self.client = genai.Client(api_key=api_key)
        self.fault_indicator = fault_indicator
        self.success_signal = success_signal
        self.task = task
        self.title = title
        self.try_this = try_this
        self.what_you_did = what_you_did
        self.why_it_matters = why_it_matters
        
    def director_system_instructions(self) -> str:
        instructions= """
        You are “TrueSwing Drill Visual Director”.

        Task:
        Given structured drill fields, produce one or more image-generation prompts that create minimal, easy-to-understand drill visuals for golfers.

        Output constraints:
        - Output MUST be valid JSON only. No markdown, no code fences, no commentary.
        - The final image(s) MUST contain NO text (no titles, no captions, no labels, no callout boxes, no words).
        - Allowed overlays are only simple geometry and symbols:
        - thin solid/dashed lines, arrows, circles
        - simple icons (check mark, X, stop icon)
        - no letters, no numbers, no words

        Visual style:
        - Clean instructional illustration (flat or semi-flat vector style), high contrast, consistent across drills.
        - Minimal background clutter (plain light background or simple mat).
        - Anatomically plausible golfer and correctly shaped golf club (no extra limbs/fingers, no warped club).
        - No brand logos, watermarks, or identifiable real people.

        Instructional design rules:
        - Use 1–2 frames by default. Use 2 frames when showing a limit or comparison (e.g., “stop here” vs “too far”).
        - Each frame must communicate one idea only.
        - Prefer showing the “correct” movement/position, and only show “wrong” if it materially clarifies the drill.
        - If showing a “limit”, express it with a single primary reference guide (e.g., shoulder-height dashed line, hip-depth vertical line, head boundary box).
        - If the drill relates to:
        - hand height / overswing / width: prefer face-on view
        - swing plane / club path: prefer down-the-line view
        - low point / weight shift: prefer face-on view

        Defaults (if not provided):
        - handedness: right-handed
        - club: iron
        - environment: plain studio background with a small hitting mat
        - framing: torso+arms for hand/arm drills; full body for balance/weight drills

        Ambiguity handling:
        - If drill details are ambiguous, choose the most standard golf-coaching interpretation.
        - Convert internal text fields into visuals; do not render them as text.
        - If a prop is implied, choose a common substitute (alignment stick, towel, chair) unless forbidden.

        Return JSON with this schema:
        {
        "drill_title": string,
        "one_line_intent": string,
        "style": {
            "rendering": "instructional illustration",
            "background": "plain",
            "text_in_image": "none",
            "overlays_allowed": ["lines", "arrows", "simple icons"]
        },
        "global_constraints": {
            "handedness": "right" | "left",
            "camera_angle": "face-on" | "down-the-line",
            "framing": "full body" | "torso+arms",
            "avoid": [string, ...]
        },
        "frames": [
            {
            "frame_id": number,
            "purpose": string,
            "scene_description": string,
            "overlay_spec": {
                "guide_lines": [string, ...],
                "arrows": [string, ...],
                "icons": [string, ...]
            },
            "image_prompt": string,
            "negative_prompt": string
            }
        ]
        }
        """
        return instructions
    
    def director_user_instructions(self) -> str:
        user_prompt = f"""
        Create a minimal, text-free instructional image plan for the following golf drill.

        DRILL FIELDS:
        - title: {self.title}
        - what_you_did: {self.what_you_did}
        - why_it_matters: {self.why_it_matters}
        - try_this: {self.try_this}
        - task: {self.task}
        - success_signal: {self.success_signal}
        - fault_indicator: {self.fault_indicator}
        
        RENDERING REQUIREMENTS:
        - The generated image(s) must contain NO words at all (no titles, labels, captions, callout boxes).
        - Allowed overlays: only simple dashed/solid guide lines, arrows, circles, and simple icons (check, X, stop). No letters/numbers.
        - Choose 1–2 frames (2 if a comparison/limit improves clarity).
        - Choose the best camera angle automatically (face-on or down-the-line) based on the drill.
        - Keep background plain and uncluttered.
        - Use a right-handed golfer unless the drill fields explicitly imply left-handed.

        OUTPUT:
        Return ONLY valid JSON matching the schema from the system instructions, including image_prompt and negative_prompt per frame.
        """
        return user_prompt
    
    def generate_drill_image_prompt(self) -> dict:
        response = self.client.models.generate_content(
            model="gemini-3-pro-preview",
            config=types.GenerateContentConfig(
                system_instruction=[
                    {"text": self.director_system_instructions()}
                ],
                temperature=0.0,
                top_p=0.1,
                top_k=1
            ),
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": self.director_user_instructions()}
                    ]
                }
            ],
        )
        
        return response.candidates[0].content.parts[0].text
    
    def generate_image(self):
        response = self.director_user_instructionsclient.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[self.generate_drill_image_prompt()],
            config=types.GenerateContentConfig(
                temperature=0.0,
                top_p=0.1,
                top_k=1,
                response_modalities=["TEXT", "IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio="1:1",
                    image_size="2K",
                ),
            ),
        )
        
        # upload to cloudflare r2
        

        # Handle and save the generated image
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_data = io.BytesIO(part.inline_data.data)
                img = Image.open(image_data)
                img.save("")    
            
    def extract_image_bytes(response):
        for candidate in response.candidates:
            for part in candidate.content.parts:
                if hasattr(part, "inline_data") and part.inline_data.mime_type.startswith("image/"):
                    return base64.b64decode(part.inline_data.data)
        raise RuntimeError("No image found in Gemini response")
    
    def upload_image_to_storage(self, image_bytes: bytes, drill_id: str) -> str:
        # Generate a unique image key
        unique_image_key = f"drill_images/{drill_id}.png"
        
        # Get URL
        signed_url = video_storage_service.generate_upload_url(unique_image_key)
        
        # Upload image
        headers = {
            "Content-Type": "image/png",
            "Content-Length": str(len(image_bytes))
        }
        
        put_response = requests.put(
            signed_url,
            data=image_bytes,
            headers=headers,
            timeout=30,
        )
        
        put_response.raise_for_status()
        # Generate read URL
        read_url = video_storage_service.generate_read_url(unique_image_key)
        return read_url
        
    def execute(self, drill_id: str) -> str:
        response = self.generate_image()
        image_bytes = self.extract_image_bytes(response)
        image_url = self.upload_image_to_storage(image_bytes, drill_id)
        return image_url
        
        