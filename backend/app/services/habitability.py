
def assess_habitability(planet):
    radius = planet.get("radius")
    mass = planet.get("mass")
    temp = planet.get("equilibrium_temperature_k")
    orbit = planet.get("orbital_distance_au")
    star_temp = planet.get("stellar_temperature_k")

    measurements = {
        "radius": radius,
        "mass": mass,
        "equilibrium_temperature_k": temp,
        "orbital_distance_au": orbit,
        "stellar_temperature_k": star_temp
    }

    available = {
        key: value
        for key, value in measurements.items()
        if value is not None
    }

    missing = [
        key for key, value in measurements.items()
        if value is None
    ]

    # Radius and equilibrium temperature are required
    # for this simplified screening rule.
    if radius is None or temp is None:
        category = "Insufficient data"
        explanation = (
            "Radius or equilibrium temperature is unavailable. "
            "A preliminary screening assessment cannot be made."
        )

    elif 0.5 <= radius <= 2.0 and 180 <= temp <= 310:
        category = "Potentially interesting for further study"
        explanation = (
            "The planet meets the simplified radius and "
            "equilibrium-temperature screening thresholds. "
            "This does not establish habitability or the "
            "presence of liquid water."
        )

    else:
        category = "Requires further investigation"
        explanation = (
            "The planet does not meet one or more simplified "
            "screening thresholds. More scientific information "
            "is needed to evaluate its environment."
        )

    return {
        "category": category,
        "available_measurements": available,
        "missing_measurements": missing,
        "explanation": explanation
    }
