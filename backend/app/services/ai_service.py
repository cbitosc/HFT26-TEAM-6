
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


# Load API key from backend/.env
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


# Featherless AI configuration
API_KEY = os.getenv("FEATHERLESS_API_KEY")

if not API_KEY:
    raise ValueError(
        "FEATHERLESS_API_KEY not found. Check backend/.env"
    )

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=API_KEY
)

MODEL = "Qwen/Qwen2.5-7B-Instruct"


def ask_astronomer(question, planet_data):
    """
    Generate an exoplanet-related answer using
    Featherless AI and the supplied planet data.
    """

    prompt = f"""
You are ExoVerse AI Astronomer, a scientific assistant
inside an interactive 3D exoplanet explorer.

PLANET DATA:
{planet_data}

USER QUESTION:
{question}

INSTRUCTIONS:

1. Answer using the supplied planet data.
2. Explain scientific terms in simple language.
3. Never invent missing planetary measurements.
4. If a value is unavailable, clearly mention it.
5. Explain whether a planet may have conditions
   suitable for life, without claiming it is habitable.
6. Never claim that life exists on an exoplanet.
7. If asked about Earth comparison, explain
   similarities and differences using available data.
8. Distinguish confirmed scientific facts from
   possibilities and hypotheses.
9. Keep answers clear, structured and informative.
10. If the question is unrelated to exoplanets,
    politely guide the user back to space exploration.
11. Never infer atmospheric thickness, composition,
    temperature, or surface conditions from mass alone.
12. Clearly label scientific possibilities as hypotheses,
    not confirmed facts.
13. Do not introduce planetary facts that are not present
    in the supplied data unless clearly identified as
    general scientific background.
Give a helpful answer suitable for students
and people exploring exoplanets.
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
