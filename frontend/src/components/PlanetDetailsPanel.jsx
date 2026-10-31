import { ArrowUpRight, Award, Compass, Download, Globe2, Info, Orbit, Sparkles, Telescope } from 'lucide-react'
import { EARTH_BENCHMARK } from '../services/api'

export default function PlanetDetailsPanel({ planet, onNavigate, onCompare, onExport }) {
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

  const radiusVal = planet.radius_earth || planet.radius || null
  const massVal = planet.mass_earth || planet.mass || null
  const tempVal = planet.equilibrium_temperature_k || planet.temperature || null
  const periodVal = planet.orbital_period_days || planet.period || null

  const surfaceGravity =
    massVal && radiusVal
      ? (massVal / Math.pow(radiusVal, 2)).toFixed(2)
      : null

  // Thermal percentage along track (0 K -> 0%, 273 K -> 35%, 373 K -> 65%, 1500 K -> 95%)
  const thermalPercent = tempVal
    ? tempVal < 273
      ? Math.max(5, (tempVal / 273) * 35)
      : tempVal <= 373
      ? 35 + ((tempVal - 273) / 100) * 30
      : Math.min(95, 65 + (Math.min(tempVal - 373, 1200) / 1200) * 30)
    : null

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

      {/* Visual Goldilocks Thermal Spectrum Instrument */}
      <div className="thermal-meter-section">
        <div className="thermal-meter-header">
          <span>THERMAL SPECTRUM & GOLDILOCKS ZONE</span>
          <b>{tempVal ? `${tempVal} K (${tempVal - 273}°C)` : 'Unmeasured'}</b>
        </div>
        <div className="thermal-meter-track">
          <div className="thermal-zone thermal-zone-cold" title="Cryogenic Freeze (<273 K)" />
          <div className="thermal-zone thermal-zone-habitable" title="Liquid Water Habitable Zone (273-373 K)">
            <span>LIQUID WATER</span>
          </div>
          <div className="thermal-zone thermal-zone-hot" title="Scorching Heat (>373 K)" />
          {thermalPercent != null && (
            <div
              className="thermal-indicator"
              style={{ left: `${thermalPercent}%` }}
              title={`Equilibrium Temp: ${tempVal} K`}
            >
              <div className="thermal-pip" />
              <span className="thermal-pip-label">{tempVal}K</span>
            </div>
          )}
        </div>
        <div className="thermal-meter-labels">
          <span>0 K (Deep Freeze)</span>
          <span className="label-habitable">273 K - 373 K (Habitable)</span>
          <span>1000 K+ (Molten)</span>
        </div>
      </div>

      {/* Physical Scale Ratios Relative to Earth */}
      <div className="physical-ratio-bars">
        <div className="ratio-bar-row">
          <div className="ratio-label">
            <span>EQUATORIAL RADIUS</span>
            <b>{radiusVal ? `${radiusVal} R⊕ (${((radiusVal / 1.0) * 100).toFixed(0)}% of Earth)` : 'Unmeasured'}</b>
          </div>
          <div className="ratio-track">
            <div
              className="ratio-fill ratio-fill-radius"
              style={{ width: `${Math.min(100, Math.max(8, ((radiusVal || 1) / 3.5) * 100))}%` }}
            />
            <div className="ratio-marker-earth" style={{ left: '28.5%' }} title="Earth Baseline (1.00 R⊕)" />
          </div>
        </div>

        {massVal && (
          <div className="ratio-bar-row">
            <div className="ratio-label">
              <span>PLANETARY MASS</span>
              <b>{`${massVal} M⊕ (${((massVal / 1.0) * 100).toFixed(0)}% of Earth)`}</b>
            </div>
            <div className="ratio-track">
              <div
                className="ratio-fill ratio-fill-mass"
                style={{ width: `${Math.min(100, Math.max(8, (massVal / 8) * 100))}%` }}
              />
              <div className="ratio-marker-earth" style={{ left: '12.5%' }} title="Earth Baseline (1.00 M⊕)" />
            </div>
          </div>
        )}

        {surfaceGravity && (
          <div className="ratio-bar-row">
            <div className="ratio-label">
              <span>SURFACE GRAVITY</span>
              <b>{`${surfaceGravity} g (${((parseFloat(surfaceGravity) / 1.0) * 100).toFixed(0)}% of Earth)`}</b>
            </div>
            <div className="ratio-track">
              <div
                className="ratio-fill ratio-fill-gravity"
                style={{ width: `${Math.min(100, Math.max(8, (parseFloat(surfaceGravity) / 2.5) * 100))}%` }}
              />
              <div className="ratio-marker-earth" style={{ left: '40%' }} title="Earth Gravity (1.00 g)" />
            </div>
          </div>
        )}

        {periodVal && (
          <div className="ratio-bar-row">
            <div className="ratio-label">
              <span>ORBITAL YEAR CYCLE</span>
              <b>{`${periodVal} Days (${((periodVal / 365.25) * 100).toFixed(0)}% of Earth Year)`}</b>
            </div>
            <div className="ratio-track">
              <div
                className="ratio-fill ratio-fill-year"
                style={{ width: `${Math.min(100, Math.max(8, (periodVal / 500) * 100))}%` }}
              />
              <div className="ratio-marker-earth" style={{ left: '73%' }} title="Earth Year (365.25 Days)" />
            </div>
          </div>
        )}
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

        {onExport && (
          <button
            type="button"
            className="icon-action"
            aria-label="Export mission dossier"
            title="Export mission dossier & scientific report (PDF / DOCX / ZIP)"
            onClick={() => onExport(planet)}
          >
            <Download size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
