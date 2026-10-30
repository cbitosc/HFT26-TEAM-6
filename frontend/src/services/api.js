import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Earth benchmark for comparative baseline
export const EARTH_BENCHMARK = {
  id: 'earth',
  name: 'Earth (Sol d)',
  host_star: 'Sun (Sol)',
  planet_type: 'Terrestrial (Habitable Baseline)',
  radius_earth: 1.0,
  mass_earth: 1.0,
  distance_pc: 0.0,
  orbital_period_days: 365.25,
  equilibrium_temperature_k: 255,
  discovery_year: 'Baseline',
  color: '#4fa8ff',
  code: 'SOL-03',
  has_rings: false,
  description: 'Our home world, the standard astronomical baseline for exoplanetary comparisons and habitability research.',
  habitability: 'Conservative',
}

// Standardized NASA Exoplanet Archive Dataset with accurate measurements
// Habitability strictly uses: 'Conservative' | 'Optimistic' | 'Hostile'
export const INITIAL_PLANETS = [
  {
    id: 'kepler-186-f',
    name: 'Kepler-186f',
    host_star: 'Kepler-186',
    planet_type: 'Terrestrial (Habitable Zone)',
    radius_earth: 1.17,
    mass_earth: 1.44,
    distance_pc: 178.5,
    orbital_period_days: 129.9,
    equilibrium_temperature_k: 188,
    discovery_year: 2014,
    color: '#8bd6c3',
    code: 'K-186 F',
    has_rings: false,
    description: 'First Earth-size planet discovered in the habitable zone of another star.',
    habitability: 'Optimistic',
  },
  {
    id: '55-cancri-e',
    name: '55 Cancri e',
    host_star: '55 Cancri A',
    planet_type: 'Lava World (Super-Earth)',
    radius_earth: 1.88,
    mass_earth: 7.99,
    distance_pc: 12.6,
    orbital_period_days: 0.74,
    equilibrium_temperature_k: 2243,
    discovery_year: 2004,
    color: '#ff4d00',
    code: '55 C-E',
    has_rings: false,
    description: 'Ultra-short period super-Earth with surface temperatures high enough to melt silicate rock into magma oceans.',
    habitability: 'Hostile',
  },
  {
    id: 'wasp-12-b',
    name: 'WASP-12b',
    host_star: 'WASP-12',
    planet_type: 'Gas Giant (Hot Jupiter)',
    radius_earth: 21.7, // ~1.94 R_Jupiter
    mass_earth: 467.0,  // ~1.47 M_Jupiter
    distance_pc: 433.0,
    orbital_period_days: 1.09,
    equilibrium_temperature_k: 2525,
    discovery_year: 2008,
    color: '#e0a96d',
    code: 'W-12 B',
    has_rings: true,
    description: 'Tidally distorted hot Jupiter losing its atmosphere to its host star at a rate of 189 quadrillion tons per year.',
    habitability: 'Hostile',
  },
  {
    id: 'trappist-1-e',
    name: 'TRAPPIST-1e',
    host_star: 'TRAPPIST-1',
    planet_type: 'Terrestrial (Habitable Zone)',
    radius_earth: 0.92,
    mass_earth: 0.69,
    distance_pc: 12.1,
    orbital_period_days: 6.1,
    equilibrium_temperature_k: 251,
    discovery_year: 2017,
    color: '#b9a7f7',
    code: 'T-1 E',
    has_rings: false,
    description: 'Closest Earth-mass analog in the TRAPPIST-1 ultra-cool dwarf system with highest potential for liquid surface water.',
    habitability: 'Conservative',
  },
  {
    id: 'gliese-436-b',
    name: 'Gliese 436 b',
    host_star: 'Gliese 436',
    planet_type: 'Ice World (Warm Neptune)',
    radius_earth: 4.17,
    mass_earth: 21.4,
    distance_pc: 9.75,
    orbital_period_days: 2.64,
    equilibrium_temperature_k: 712,
    discovery_year: 2004,
    color: '#70c1e8',
    code: 'GL-436 B',
    has_rings: false,
    description: 'Exotic ice giant containing high-pressure crystalline exotic ice (Ice X) cloaked in a massive evaporating comet-like hydrogen cloud.',
    habitability: 'Hostile',
  },
  {
    id: 'proxima-centauri-b',
    name: 'Proxima Centauri b',
    host_star: 'Proxima Centauri',
    planet_type: 'Desert World (Rocky Candidate)',
    radius_earth: 1.07,
    mass_earth: 1.17,
    distance_pc: 1.30,
    orbital_period_days: 11.2,
    equilibrium_temperature_k: 234,
    discovery_year: 2016,
    color: '#e5a576',
    code: 'PC B',
    has_rings: false,
    description: 'The closest known exoplanet to Earth, orbiting our neighboring red dwarf in the habitable zone but subjected to stellar flares.',
    habitability: 'Optimistic',
  },
  {
    id: 'toi-700-d',
    name: 'TOI-700 d',
    host_star: 'TOI-700',
    planet_type: 'Terrestrial (Habitable Zone)',
    radius_earth: 1.14,
    mass_earth: 1.25,
    distance_pc: 31.1,
    orbital_period_days: 37.4,
    equilibrium_temperature_k: 269,
    discovery_year: 2020,
    color: '#e2c675',
    code: 'TOI D',
    has_rings: false,
    description: 'Discovered by NASA TESS, a temperate Earth-size world orbiting a quiet M-dwarf star with no observed superflares.',
    habitability: 'Conservative',
  },
  {
    id: 'kepler-452-b',
    name: 'Kepler-452 b',
    host_star: 'Kepler-452',
    planet_type: 'Super-Earth (Habitable Zone)',
    radius_earth: 1.63,
    mass_earth: null, // Intentionally null to test graceful missing value handling ('Unmeasured')
    distance_pc: 550.0,
    orbital_period_days: 384.8,
    equilibrium_temperature_k: 265,
    discovery_year: 2015,
    color: '#78c2ad',
    code: 'K-452 B',
    has_rings: false,
    description: 'Often dubbed "Earth 2.0", orbiting a G-type sun-like star in an orbit nearly identical to Earth, though true mass is unconfirmed.',
    habitability: 'Optimistic',
  },
]

// API Endpoints with graceful mock fallback
export async function getPlanets() {
  try {
    const res = await api.get('/api/planets')
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data
    }
    return INITIAL_PLANETS
  } catch (err) {
    console.warn('Backend /api/planets unavailable, using NASA catalogue dataset fallback:', err.message)
    return INITIAL_PLANETS
  }
}

export async function getPlanetById(planetId) {
  try {
    const res = await api.get(`/api/planets/${encodeURIComponent(planetId)}`)
    return res.data
  } catch (err) {
    const all = [EARTH_BENCHMARK, ...INITIAL_PLANETS]
    const found = all.find((p) => p.id === planetId || p.name.toLowerCase() === String(planetId).toLowerCase())
    if (found) return found
    throw err
  }
}

export async function comparePlanets(planetAId, planetBId) {
  try {
    const res = await api.post('/api/compare', {
      planet1_id: planetAId,
      planet2_id: planetBId,
      planet_a_id: planetAId,
      planet_b_id: planetBId,
    })
    return res.data
  } catch {
    const all = [EARTH_BENCHMARK, ...INITIAL_PLANETS]
    const pA = all.find((p) => p.id === planetAId || p.name === planetAId) || INITIAL_PLANETS[0]
    const pB = all.find((p) => p.id === planetBId || p.name === planetBId) || INITIAL_PLANETS[1]
    return {
      planet_a: pA,
      planet_b: pB,
      radius_diff: pA.radius_earth && pB.radius_earth ? Number((pA.radius_earth - pB.radius_earth).toFixed(2)) : null,
      mass_diff: pA.mass_earth && pB.mass_earth ? Number((pA.mass_earth - pB.mass_earth).toFixed(2)) : null,
      temp_diff: pA.equilibrium_temperature_k && pB.equilibrium_temperature_k ? pA.equilibrium_temperature_k - pB.equilibrium_temperature_k : null,
      period_diff: pA.orbital_period_days && pB.orbital_period_days ? Number((pA.orbital_period_days - pB.orbital_period_days).toFixed(2)) : null,
    }
  }
}

export async function chatWithAstronomer(question, planetData, context = []) {
  try {
    const res = await api.post('/api/chat', {
      question,
      planet_names: planetData?.name ? [planetData.name] : [],
      planet_data: planetData,
      context,
    })
    return res.data.answer || res.data.response || res.data
  } catch (err) {
    console.warn('Backend /api/chat error, generating fallback astronomer response:', err.message)
    const pName = planetData?.name || 'this exoplanet'
    const temp = planetData?.equilibrium_temperature_k ? `${planetData.equilibrium_temperature_k} K` : 'an unmeasured temperature'
    const radius = planetData?.radius_earth ? `${planetData.radius_earth} Earth radii` : 'unknown size'

    return `### Astronomer Field Notes for ${pName}\n\nBased on observation data, **${pName}** has a measured radius of ${radius} and equilibrium temperature of approximately ${temp}.\n\nRegarding your question: "${question}"\n\nWhile scientific models provide valuable estimates about atmospheric retention and orbital mechanics, habitability indicators only describe orbital potential—not biological proof. Further spectroscopic analysis by instruments like JWST will help determine atmospheric composition.`
  }
}
