from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.Gemini.geminiTemplate import GeminiTemplate
from google.genai import types


class Gemini_25_flash(GeminiTemplate):

    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, content: list[dict[str, str]]):
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=[
                    {"text": self.system_instructions.get()}
                ],
            ),
            contents=[
                {
                    "role": "user",
                    "parts": content,
                },
            ],
        )
        
        return response

