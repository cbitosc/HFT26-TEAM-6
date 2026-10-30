
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load API key from .env
load_dotenv()

api_key = os.getenv("FEATHERLESS_API_KEY")

if not api_key:
    print("API key not found. Check your .env file.")
    exit()

# Connect to Featherless
client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=api_key
)

# Send a test question
response = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful astronomy assistant."
        },
        {
            "role": "user",
            "content": "What are exoplanets? Explain simply."
        }
    ],
    max_tokens=200
)

print("\nAI RESPONSE:")
print(response.choices[0].message.content)
