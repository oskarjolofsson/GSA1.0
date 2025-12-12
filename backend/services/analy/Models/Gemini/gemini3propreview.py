from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.Gemini.geminiTemplate import GeminiTemplate


class Gemini_3_pro_preview(GeminiTemplate):

    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, content: list[dict[str, str]]):
        response = self.client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=[
                {
                    "role": "user",
                    "parts": [{"text": self.system_instructions.get()}]},
                {
                    "role": "user",
                    "parts": content,
                },
            ],
        )
        
        return response

