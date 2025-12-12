from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.Gemini.geminiTemplate import GeminiTemplate


class Gemini_25_flash_lite(GeminiTemplate):

    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, content: list[dict[str, str]]):
        response = self.client.models.generate_content(
            model="	gemini-2.5-flash-lite",
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

