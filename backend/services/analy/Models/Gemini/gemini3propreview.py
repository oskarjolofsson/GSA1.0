from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.Gemini.geminiTemplate import GeminiTemplate
from google.genai import types

class Gemini_3_pro_preview(GeminiTemplate):

    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, user_prompt: str, video: str):
        print("Gemini 3 Pro Preview Analysis Started")
        
        content = [
            {"fileData": {"fileUri": video.uri}}
        ]
        
        response = self.client.models.generate_content(
            model="gemini-3-pro-preview",
            config=types.GenerateContentConfig(
                system_instruction=[
                    {"text": self.system_instructions.get()}
                ],
                temperature=0.0,
                top_p=0.1,
                top_k=1
            ),
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": user_prompt},
                        *content  # video or other multimodal parts
                    ]
                }
            ],
        )
        
        return response

