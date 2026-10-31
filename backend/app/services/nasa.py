
from app.utils.cache import save_cache, load_cache

import httpx
import time
import threading

NASA_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

QUERY = """
SELECT
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

CACHE_DURATION = 3600

# Load the saved catalogue immediately when the backend starts.
cache = load_cache()
last_fetch = time.time() if cache else 0

refresh_lock = threading.Lock()
refresh_in_progress = False


def convert_planet(item):
    return {
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
    }


def refresh_nasa_cache():
    global cache, last_fetch, refresh_in_progress

    try:
        response = httpx.get(
            NASA_URL,
            params={"query": QUERY, "format": "json"},
            timeout=120
        )
        response.raise_for_status()

        records = response.json()

        planets = [
            convert_planet(item)
            for item in records
            if item.get("pl_name")
        ]

        if not planets:
            raise ValueError("NASA returned no planets")

        cache = planets
        last_fetch = time.time()

        try:
            save_cache(planets)
        except OSError as error:
            print("Cache Save Error:", error)

        print(f"NASA catalogue refreshed: {len(planets)} planets")

    except (httpx.HTTPError, ValueError) as error:
        print("NASA API Error:", error)

    finally:
        refresh_in_progress = False


def get_planets():
    global refresh_in_progress

    # Return saved or in-memory data immediately.
    if cache:
        if time.time() - last_fetch >= CACHE_DURATION:
            with refresh_lock:
                if not refresh_in_progress:
                    refresh_in_progress = True

                    threading.Thread(
                        target=refresh_nasa_cache,
                        daemon=True
                    ).start()

        return cache

    # First-ever fetch, only when no saved cache exists.
    with refresh_lock:
        if not refresh_in_progress:
            refresh_in_progress = True

    refresh_nasa_cache()
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
            params={"query": query, "format": "json"},
            timeout=45
        )
        response.raise_for_status()

        return [
            convert_planet(item)
            for item in response.json()
            if item.get("pl_name")
        ]

    except (httpx.HTTPError, ValueError) as error:
        print("NASA Search Error:", error)
        return []
