from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.OpenAI.gptTemplate import GptTemplate

class Gpt5_nano_AnalysisService(GptTemplate):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, content: list[dict[str, str]]):
        # Response is a string response
        response = self.client.responses.create(
            model="gpt-5-nano",
            input=[
                {"role": "system", "content": self.system_instructions.get()},
                {"role": "user", "content": content,}
            ],
        )
        return response
    