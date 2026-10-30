
from app.utils.cache import save_cache, load_cache

import httpx
import time

NASA_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

QUERY = """
SELECT TOP 200
pl_name,
hostname,
discoverymethod,
disc_year,
pl_orbper,
pl_rade,
pl_bmasse,
pl_orbsmax,
pl_eqt,
st_teff,
sy_dist
FROM pscomppars
WHERE pl_name IS NOT NULL
ORDER BY pl_name
"""

cache = []
last_fetch = 0
CACHE_DURATION = 3600


def get_planets():
    global cache, last_fetch

    if cache and time.time() - last_fetch < CACHE_DURATION:
        return cache

    try:
        response = httpx.get(
            NASA_URL,
            params={
                "query": QUERY,
                "format": "json"
            },
            timeout=45
        )

        response.raise_for_status()

        planets = []

        for item in response.json():
            planets.append({
                "id": item.get("pl_name"),
                "name": item.get("pl_name"),
                "host_star": item.get("hostname"),
                "radius": item.get("pl_rade"),
                "mass": item.get("pl_bmasse"),
                "distance_pc": item.get("sy_dist"),
                "orbital_period_days": item.get("pl_orbper"),
                "orbital_distance_au": item.get("pl_orbsmax"),
                "equilibrium_temperature_k": item.get("pl_eqt"),
                "stellar_temperature_k": item.get("st_teff"),
                "discovery_year": item.get("disc_year"),
                "discovery_method": item.get("discoverymethod")
            })

        if not planets:
            raise ValueError("NASA returned no planets")

        cache = planets
        last_fetch = time.time()

        try:
            save_cache(planets)
        except OSError as error:
            print("Cache Save Error:", error)

        print(f"NASA catalogue loaded: {len(planets)} planets")

        return planets

    except (httpx.HTTPError, ValueError) as error:
        print("NASA API Error:", error)

        if cache:
            return cache

        cache = load_cache()
        last_fetch = time.time()

        return cache


def search_nasa_planets(name):
    query = """
    SELECT TOP 20
    pl_name,
    hostname,
    discoverymethod,
    disc_year,
    pl_orbper,
    pl_rade,
    pl_bmasse,
    pl_orbsmax,
    pl_eqt,
    st_teff,
    sy_dist
    FROM pscomppars
    WHERE pl_name LIKE '%{}%'
    ORDER BY pl_name
    """.format(name.replace("'", "''"))

    try:
        response = httpx.get(
            NASA_URL,
            params={
                "query": query,
                "format": "json"
            },
            timeout=30
        )

        response.raise_for_status()

        planets = []

        for item in response.json():
            planets.append({
                "id": item.get("pl_name"),
                "name": item.get("pl_name"),
                "host_star": item.get("hostname"),
                "radius": item.get("pl_rade"),
                "mass": item.get("pl_bmasse"),
                "distance_pc": item.get("sy_dist"),
                "orbital_period_days": item.get("pl_orbper"),
                "orbital_distance_au": item.get("pl_orbsmax"),
                "equilibrium_temperature_k": item.get("pl_eqt"),
                "stellar_temperature_k": item.get("st_teff"),
                "discovery_year": item.get("disc_year"),
                "discovery_method": item.get("discoverymethod")
            })

        return planets

    except httpx.HTTPError as error:
        print("NASA Search Error:", error)
        return []
