
import json
from pathlib import Path

CACHE_FILE = Path(__file__).resolve().parent / "planets_cache.json"


def save_cache(planets):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(CACHE_FILE, "w", encoding="utf-8") as file:
        json.dump(planets, file, indent=2)


def load_cache():
    if not CACHE_FILE.exists():
        return []

    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return []
