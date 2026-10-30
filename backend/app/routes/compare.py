
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.nasa import get_planets, search_nasa_planets

router = APIRouter()


class CompareRequest(BaseModel):
    planet_names: list[str] = Field(min_length=2, max_length=2)


@router.post("/api/compare")
def compare_planets(request: CompareRequest):
    planets = get_planets()
    selected = []

    for name in request.planet_names:
        name = name.strip()

        planet = next(
            (p for p in planets
             if p["name"].lower() == name.lower()),
            None
        )

        if planet is None:
            matches = search_nasa_planets(name)

            planet = next(
                (p for p in matches
                 if p["name"].lower() == name.lower()),
                None
            )

        if planet is None:
            raise HTTPException(
                status_code=404,
                detail=f"Planet '{name}' not found"
            )

        selected.append(planet)

    p1, p2 = selected

    fields = [
        "radius",
        "mass",
        "distance_pc",
        "orbital_period_days",
        "orbital_distance_au",
        "equilibrium_temperature_k",
        "stellar_temperature_k"
    ]

    differences = {}

    for field in fields:
        value1 = p1.get(field)
        value2 = p2.get(field)

        if value1 is not None and value2 is not None:
            differences[field] = round(value1 - value2, 4)
        else:
            differences[field] = None

    return {
        "planets": selected,
        "differences": differences
    }
