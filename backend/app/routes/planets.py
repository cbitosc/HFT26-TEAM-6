
from fastapi import APIRouter, Query, HTTPException

from app.services.nasa import get_planets, search_nasa_planets
from app.services.habitability import assess_habitability

router = APIRouter()


@router.get("/api/planets")
def list_planets(
    search: str = "",
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    try:
        if search.strip():
            planets = search_nasa_planets(search.strip())
        else:
            planets = get_planets()

        total = len(planets)
        paginated_planets = planets[offset:offset + limit]

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "data": paginated_planets
        }

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve planets: {str(error)}"
        )


@router.get("/api/planets/{planet_id}")
def get_planet_details(planet_id: str):
    planets = get_planets()

    for planet in planets:
        if planet["id"].lower() == planet_id.lower():
            return {
                **planet,
                "habitability": assess_habitability(planet)
            }

    raise HTTPException(
        status_code=404,
        detail="Planet not found"
    )
