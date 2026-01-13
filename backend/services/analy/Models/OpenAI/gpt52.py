from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.OpenAI.gptTemplate import GptTemplate

class Gpt52AnalysisService(GptTemplate):
    
    def __init__(self, system_instructions: SportAnalysis):
        super().__init__(system_instructions=system_instructions)

    def ai_analysis(self, content: list[dict[str, str]]):
        print("GPT-5.2 Analysis Started")
        # Response is a string response
        response = self.client.responses.create(
            model="gpt-5.2",
            input=[
                {"role": "system", "content": self.system_instructions.get()},
                {"role": "user", "content": content,}
            ],
        )
        return response
    