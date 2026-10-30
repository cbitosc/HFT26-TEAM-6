
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.getenv("FEATHERLESS_API_KEY")
)

MODEL = "Qwen/Qwen2.5-7B-Instruct"


def ask_astronomer(question, planet_data):

    
    prompt = f"""
    You are ExoVerse AI Astronomer, an expert
    assistant for exploring exoplanets.

    PLANET DATA:
    {planet_data}

    USER QUESTION:
    {question}

    RULES:
    1. Use the supplied planet data as your source
       for specific planetary measurements.
    2. Never invent missing values.
    3. Do not assume a planet is habitable based
       only on its orbital period or radius.
    4. Explain scientific concepts in simple language.
    5. Clearly distinguish known facts from
       scientific possibilities.
    6. Never claim that a planet contains life.
    7. If information is insufficient, say so.

    Give a complete, clear and structured answer.
    """


    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=600,
        temperature=0.5
    )

    return response.choices[0].message.content
