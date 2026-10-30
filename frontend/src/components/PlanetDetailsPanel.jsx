import { ArrowUpRight, Award, Compass, Globe2, Info, Orbit, Sparkles, Telescope } from 'lucide-react'
import { EARTH_BENCHMARK } from '../services/api'

export default function PlanetDetailsPanel({ planet, onNavigate, onCompare }) {
  if (!planet) {
    return (
      <div className="details-column empty-details">
        <p>Select a planet to inspect its scientific measurements.</p>
      </div>
    )
  }

  // Consistent missing measurement formatter: Strictly 'Unmeasured' (Task #2)
  const formatRadius = (val) => (val != null ? `${val} R⊕` : 'Unmeasured')
  const formatMass = (val) => (val != null ? `${val} M⊕` : 'Unmeasured')
  const formatDistance = (val) => (val != null ? `${val} pc` : 'Unmeasured')
  const formatPeriod = (val) => (val != null ? `${val} days` : 'Unmeasured')
  const formatTemp = (val) => (val != null ? `${val} K` : 'Unmeasured')
  const formatYear = (val) => (val != null ? String(val) : 'Unmeasured')

  // Consistent Habitability terms: Conservative | Optimistic | Hostile (Task #3)
  const hab = planet.habitability || 'Hostile'
  const isConservative = hab.toLowerCase().includes('conservative')
  const isOptimistic = hab.toLowerCase().includes('optimistic')
  const isHostile = !isConservative && !isOptimistic

  const habLabel = isConservative
    ? 'Conservative Habitable Zone'
    : isOptimistic
      ? 'Optimistic Habitable Zone'
      : 'Hostile Environment'

  const habClass = isConservative
    ? 'zone-conservative'
    : isOptimistic
      ? 'zone-optimistic'
      : 'zone-hostile'

  return (
    <div className="details-column">
      {/* Top Tag & Code */}
      <div className="detail-kicker">
        <span>{planet.planet_type || 'EXOPLANET'}</span>
        <span className="detail-code">{planet.code || planet.name.slice(0, 6)}</span>
      </div>

      {/* Main Title & Host Star */}
      <h2>{planet.name}</h2>
      <p className="host-line">
        Host Star: <b>{planet.host_star || planet.star || 'Unknown'}</b>
        {planet.discovery_year && planet.discovery_year !== 'Baseline' && (
          <span className="discovery-pill">
            <Award size={11} /> Discovered {formatYear(planet.discovery_year)}
          </span>
        )}
      </p>

      {planet.description && (
        <p className="planet-summary">{planet.description}</p>
      )}

      <div className="rule" />

      {/* 8-Metric NASA Scientific Measurements Grid */}
      <div className="data-grid data-grid-extended">
        <div className="metric-box">
          <span>RADIUS</span>
          <b>{formatRadius(planet.radius_earth || planet.radius)}</b>
          <small>Earth radii</small>
        </div>

        <div className="metric-box">
          <span>MASS</span>
          <b className={planet.mass_earth ? '' : 'metric-muted'}>
            {formatMass(planet.mass_earth || planet.mass)}
          </b>
          <small>{planet.mass_earth ? 'Earth masses' : 'Spectroscopy pending'}</small>
        </div>

        <div className="metric-box">
          <span>DISTANCE</span>
          <b>{formatDistance(planet.distance_pc || planet.distance)}</b>
          <small>Parsecs from Earth</small>
        </div>

        <div className="metric-box">
          <span>ORBITAL PERIOD</span>
          <b>{formatPeriod(planet.orbital_period_days || planet.period)}</b>
          <small>Earth days</small>
        </div>

        <div className="metric-box">
          <span>EQUILIBRIUM TEMP</span>
          <b className={planet.equilibrium_temperature_k ? '' : 'metric-muted'}>
            {formatTemp(planet.equilibrium_temperature_k || planet.temperature)}
          </b>
          <small>Kelvin</small>
        </div>

        <div className="metric-box">
          <span>DISCOVERY YEAR</span>
          <b>{formatYear(planet.discovery_year)}</b>
          <small>Observation record</small>
        </div>
      </div>

      {/* Standardized Habitability Status Card */}
      <div className={`zone-note ${habClass}`}>
        <span className="zone-symbol">{isHostile ? '⊘' : '◎'}</span>
        <p>
          <b>{habLabel}</b>
          <small>
            Habitability indicators describe orbital mechanics and potential, not biological proof. Surface conditions remain unconfirmed.
          </small>
        </p>
      </div>

      {/* Scientific Disclaimer & Illustrative Scale Note */}
      <div className="illustrative-note">
        <Info size={13} />
        <span>Appearance and rendered size are illustrative, not to scale. Actual values derived from NASA Exoplanet Archive.</span>
      </div>

      {/* Action Buttons */}
      <div className="detail-actions">
        {onNavigate && (
          <button
            type="button"
            className="primary-action"
            onClick={() => onNavigate('Explore')}
          >
            <Telescope size={14} />
            <span>Explore in 3D</span>
            <ArrowUpRight size={13} />
          </button>
        )}

        {/* Task #9: Compare with Earth Button */}
        {onCompare && planet.id !== 'earth' && (
          <button
            type="button"
            className="secondary-action"
            title="Compare this world with Earth side-by-side"
            onClick={() => onCompare(planet, EARTH_BENCHMARK)}
          >
            <Globe2 size={14} />
            <span>Compare with Earth</span>
          </button>
        )}

        {onCompare && (
          <button
            type="button"
            className="icon-action"
            aria-label="Compare planet"
            title="Open comparison laboratory"
            onClick={() => onCompare(planet)}
          >
            <Orbit size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
