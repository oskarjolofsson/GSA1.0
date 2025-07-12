import openai
import os
from dotenv import load_dotenv

class OpenAIClient:
    def __init__(self):
        load_dotenv()

        # Best practice: load from environment variable
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable not set.")
        
        self.client = openai.OpenAI(api_key=api_key)

    def get_swing_advice(self, user_message: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a very experienced golf trainer who has worked at Falsterbo Golf Club in Sweden for 20 years. you should give short answers with 5 drills. No small talk"},
                {"role": "user", "content": user_message}
            ],
            temperature=1.5,  # Adjusted temperature for more creative responses
        )
        return response.choices[0].message.content
    
if __name__ == "__main__":
    client = OpenAIClient()
    advice = client.get_swing_advice("What is the best way to cure my slice?")
    print(advice)