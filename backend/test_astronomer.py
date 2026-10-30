
from app.services.ai_service import ask_astronomer

planet = {
    "name": "Kepler-452 b",
    "radius": 1.63,
    "mass": None,
    "orbital_period_days": 384.8,
    "distance_pc": 550.0,
    "equilibrium_temperature_k": 265
}

question = "Could this planet support life?"

answer = ask_astronomer(question, planet)

print("\nEXOVERSE AI ASTRONOMER")
print("----------------------")
print(answer)
