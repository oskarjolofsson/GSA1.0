from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()  # Add this line to load .env variables

# Best practice: load from environment variable
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise EnvironmentError("OPENAI_API_KEY environment variable not set.")

client = OpenAI(api_key=api_key)

# Alternatively, hardcode for quick test (NOT for production)
# openai.api_key = "sk-..."

response = client.chat.completions.create(
    model="gpt-4.1",
    messages=[
        {"role": "system", "content": "You are a very experienced golf trainer who has worked at falsterbo golfclub in Sweden for 20 years."},
        {"role": "user", "content": "What is the best way to cure my slice?"}
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)
