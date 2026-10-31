/**
 * Scientific Earth Similarity Index (ESI) calculation & Habitability Helpers
 * Based on Planetary Habitability Laboratory (PHL) formulations
 */

export function calculateESI(planet) {
  if (!planet) return null

  const r = planet.radius_earth || (typeof planet.radius === 'number' ? planet.radius : null)
  const m = planet.mass_earth || (typeof planet.mass === 'number' ? planet.mass : null)
  const t = planet.equilibrium_temperature_k || (typeof planet.temperature === 'number' ? planet.temperature : null)

  const usedMetrics = []
  const missingMetrics = []

  let weightSum = 0
  let subScoreSum = 0

  // 1. Radius ESI (weight 0.57, baseline 1.0 Earth radii)
  if (r != null) {
    const diff = Math.abs(r - 1.0) / (r + 1.0)
    const subScore = Math.max(0, 1 - diff) ** 0.57
    subScoreSum += subScore * 0.57
    weightSum += 0.57
    usedMetrics.push({ name: 'Radius', value: `${r} R⊕`, status: 'Measured' })
  } else {
    missingMetrics.push('Radius')
  }

  // 2. Mass ESI (weight 1.07, baseline 1.0 Earth masses)
  if (m != null) {
    const diff = Math.abs(m - 1.0) / (m + 1.0)
    const subScore = Math.max(0, 1 - diff) ** 1.07
    subScoreSum += subScore * 1.07
    weightSum += 1.07
    usedMetrics.push({ name: 'Mass', value: `${m} M⊕`, status: 'Measured' })
  } else {
    missingMetrics.push('Mass')
  }

  // 3. Temperature ESI (weight 5.58, baseline 255 K equilibrium temp)
  if (t != null) {
    const diff = Math.abs(t - 255) / (t + 255)
    const subScore = Math.max(0, 1 - diff) ** 5.58
    subScoreSum += subScore * 5.58
    weightSum += 5.58
    usedMetrics.push({ name: 'Equilibrium Temp', value: `${t} K`, status: 'Measured' })
  } else {
    missingMetrics.push('Temperature')
  }

  // Final weighted ESI
  const score = weightSum > 0 ? Number((subScoreSum / weightSum).toFixed(2)) : 0
  const isPartial = missingMetrics.length > 0

  return {
    score: Math.min(1.0, Math.max(0, score)),
    percentage: Math.round(score * 100),
    isPartial,
    usedMetrics,
    missingMetrics,
    rating:
      score >= 0.82
        ? 'High Similarity'
        : score >= 0.65
          ? 'Moderate Similarity'
          : score >= 0.4
            ? 'Low Similarity'
            : 'Non-Earth Analog',
  }
}

export function getHabitabilityZone(planet) {
  const h = (planet?.habitability || 'Hostile').toLowerCase()
  if (h.includes('conservative')) return 'Conservative'
  if (h.includes('optimistic')) return 'Optimistic'
  return 'Hostile'
}
