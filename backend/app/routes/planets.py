
from fastapi import APIRouter, Query, HTTPException
from app.services.nasa import get_planets, search_nasa_planets
from app.services.habitability import assess_habitability

router = APIRouter()


@router.get("/api/planets")
def list_planets(
    search: str = "",
    limit: int = Query(20, ge=1, le=200)
):
    if search.strip():
        planets = search_nasa_planets(search.strip())
    else:
        planets = get_planets()

    return {
        "total": len(planets),
        "data": planets[:limit]
    }


@router.get("/api/planets/{planet_id}")
def get_planet_details(planet_id: str):
    planets = get_planets()

    planet = next(
        (
            p for p in planets
            if p["id"].lower() == planet_id.lower()
        ),
        None
    )

    if planet is None:
        matches = search_nasa_planets(planet_id)
        planet = next(
            (
                p for p in matches
                if p["id"].lower() == planet_id.lower()
            ),
            None
        )

    if planet is None:
        raise HTTPException(
            status_code=404,
            detail="Planet not found"
        )

    return {
        **planet,
        "habitability": assess_habitability(planet)
    }
