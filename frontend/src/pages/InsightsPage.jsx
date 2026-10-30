import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowUpRight, Award, CheckCircle2, ChevronRight,
  Compass, Flame, Globe2, HelpCircle, Info, Orbit, ShieldAlert,
  ShieldCheck, Sparkles, Telescope, Thermometer, XCircle, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts'
import { calculateESI, getHabitabilityZone } from '../utils/habitability'
import { EARTH_BENCHMARK } from '../services/api'

export default function InsightsPage({
  worlds = [],
  selectedPlanet = null,
  onNavigate,
}) {
  const allPlanets = useMemo(() => {
    return [EARTH_BENCHMARK, ...worlds.filter((w) => w.id !== 'earth')]
  }, [worlds])

  const [activePlanetId, setActivePlanetId] = useState(
    selectedPlanet?.id || allPlanets[1]?.id || 'kepler-186-f'
  )

  const activePlanet = useMemo(() => {
    return allPlanets.find((p) => p.id === activePlanetId) || allPlanets[1]
  }, [allPlanets, activePlanetId])

  const esiData = useMemo(() => {
    return calculateESI(activePlanet)
  }, [activePlanet])

  // Aggregate statistics across the catalogue
  const stats = useMemo(() => {
    let conservativeCount = 0
    let optimisticCount = 0
    let hostileCount = 0

    let terrestrialCount = 0
    let superEarthCount = 0
    let gasGiantCount = 0
    let iceWorldCount = 0

    worlds.forEach((p) => {
      const zone = getHabitabilityZone(p)
      if (zone === 'Conservative') conservativeCount++
      else if (zone === 'Optimistic') optimisticCount++
      else hostileCount++

      const type = (p.planet_type || p.type || '').toLowerCase()
      if (type.includes('gas') || (p.radius_earth && p.radius_earth > 10)) {
        gasGiantCount++
      } else if (type.includes('ice') || type.includes('neptune')) {
        iceWorldCount++
      } else if (type.includes('super-earth') || (p.radius_earth && p.radius_earth > 1.25)) {
        superEarthCount++
      } else {
        terrestrialCount++
      }
    })

    return {
      total: worlds.length,
      conservativeCount,
      optimisticCount,
      hostileCount,
      terrestrialCount,
      superEarthCount,
      gasGiantCount,
      iceWorldCount,
    }
  }, [worlds])

  // Recharts Chart Data: Habitability Breakdown
  const zoneChartData = useMemo(() => {
    return [
      { name: 'Conservative Zone', count: stats.conservativeCount, color: '#8bd6c3' },
      { name: 'Optimistic Zone', count: stats.optimisticCount, color: '#e2c675' },
      { name: 'Hostile Environment', count: stats.hostileCount, color: '#ff7675' },
    ]
  }, [stats])

  // Recharts Chart Data: Classification Breakdown
  const classChartData = useMemo(() => {
    return [
      { name: 'Terrestrial', count: stats.terrestrialCount, color: '#8bd6c3' },
      { name: 'Super-Earths', count: stats.superEarthCount, color: '#78c2ad' },
      { name: 'Ice Worlds', count: stats.iceWorldCount, color: '#70c1e8' },
      { name: 'Gas Giants', count: stats.gasGiantCount, color: '#e0a96d' },
    ]
  }, [stats])

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <b>{data.name}</b>
          <div style={{ color: data.color }}>
            <span>Confirmed Worlds: </span>
            <strong>{data.count}</strong>
          </div>
        </div>
      )
    }
    return null
  }

  const activeZone = getHabitabilityZone(activePlanet)

  return (
    <div className="content-wrap insights-page">
      {/* Header */}
      <section className="page-heading">
        <div>
          <div className="eyebrow">PLANETARY HABITABILITY LABORATORY <span>—</span> SCIENTIFIC INSIGHTS</div>
          <h1>Habitability <em>Insights.</em></h1>
          <p>Cross-examining theoretical habitable zones, Earth Similarity Index (ESI), and data completeness.</p>
        </div>
        <div className="heading-index">
          <span>CATALOGUE SCOPE</span>
          <b>{String(worlds.length).padStart(2, '0')}</b>
          <small>mapped systems</small>
        </div>
      </section>

      {/* Mandatory Scientific Disclaimer Banner */}
      <section className="scientific-disclaimer-banner">
        <div className="disclaimer-icon">
          <Info size={20} />
        </div>
        <div className="disclaimer-body">
          <h4>SCIENTIFIC NOTICE: HABITABILITY INDICATORS DO NOT ESTABLISH THE EXISTENCE OF LIFE</h4>
          <p>
            Habitable zone classifications describe orbital mechanics and stellar flux where liquid water <em>could theoretically exist</em> under Earth-like atmospheric conditions. They do <strong>not</strong> prove the presence of surface liquid water, atmosphere, or biological activity. No extraterrestrial life has ever been detected on any known exoplanet.
          </p>
        </div>
      </section>

      {/* Habitability Triad Cards */}
      <section className="habitability-triad-grid">
        {/* 1. Conservative */}
        <div className="triad-card triad-conservative">
          <div className="triad-top">
            <span className="triad-badge">CONSERVATIVE ZONE</span>
            <ShieldCheck size={18} />
          </div>
          <h3>{stats.conservativeCount} Worlds</h3>
          <p>
            Receive 90%–115% of Earth's stellar flux. Highest probability for retaining liquid surface oceans without runaway greenhouse or runaway glaciation.
          </p>
          <div className="triad-examples">
            <span>Examples:</span>
            <b>TRAPPIST-1e, TOI-700 d, Earth</b>
          </div>
        </div>

        {/* 2. Optimistic */}
        <div className="triad-card triad-optimistic">
          <div className="triad-top">
            <span className="triad-badge">OPTIMISTIC ZONE</span>
            <Compass size={18} />
          </div>
          <h3>{stats.optimisticCount} Worlds</h3>
          <p>
            Positioned on early Mars or recent Venus orbital boundaries. Could sustain surface water depending on atmospheric greenhouse density and cloud albedo.
          </p>
          <div className="triad-examples">
            <span>Examples:</span>
            <b>Kepler-186f, Kepler-452 b</b>
          </div>
        </div>

        {/* 3. Hostile */}
        <div className="triad-card triad-hostile">
          <div className="triad-top">
            <span className="triad-badge">HOSTILE ENVIRONMENT</span>
            <Flame size={18} />
          </div>
          <h3>{stats.hostileCount} Worlds</h3>
          <p>
            Subjected to extreme equilibrium temperatures (&gt;1,000 K), severe tidal destruction, or deep planetary freezing. Liquid water cannot exist.
          </p>
          <div className="triad-examples">
            <span>Examples:</span>
            <b>55 Cancri e, WASP-12b, Gliese 436 b</b>
          </div>
        </div>
      </section>

      {/* Deep-Dive Planet Inspector */}
      <section className="deep-dive-section">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">DEEP-DIVE INSPECTOR <span>—</span> EARTH SIMILARITY INDEX</div>
            <h3>Evaluate Planetary Analogs</h3>
          </div>
          <div className="deep-dive-select-wrap">
            <label htmlFor="deep-dive-planet-select">INSPECT WORLD:</label>
            <select
              id="deep-dive-planet-select"
              value={activePlanetId}
              onChange={(e) => setActivePlanetId(e.target.value)}
              className="deep-dive-select"
            >
              {allPlanets.map((p) => (
                <option key={`dd-${p.id}`} value={p.id}>
                  {p.name} ({p.host_star})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="inspector-card">
          {/* Left Column: ESI Gauge & Status */}
          <div className="esi-score-pane" style={{ '--accent-color': activePlanet.color }}>
            <span className="score-kicker">EARTH SIMILARITY INDEX (ESI)</span>
            <div className="esi-number-display">
              <b>{esiData.score.toFixed(2)}</b>
              <small>/ 1.00</small>
            </div>

            <div className="esi-bar-wrap">
              <div
                className="esi-bar-fill"
                style={{
                  width: `${esiData.percentage}%`,
                  backgroundColor:
                    esiData.score >= 0.75
                      ? '#8bd6c3'
                      : esiData.score >= 0.5
                        ? '#e2c675'
                        : '#ff7675',
                }}
              />
            </div>

            <div className="esi-rating-tag">
              <span>{esiData.rating}</span>
            </div>

            {/* Task #18: Honest Partial-Score Flag */}
            {esiData.isPartial && (
              <div className="partial-score-alert">
                <AlertTriangle size={14} />
                <div>
                  <b>Partial Score Flag</b>
                  <p>
                    {esiData.missingMetrics.join(', ')} currently unmeasured. Calculated from available parameters only.
                  </p>
                </div>
              </div>
            )}

            <div className="esi-actions">
              {onNavigate && (
                <button
                  type="button"
                  className="esi-action-btn"
                  onClick={() => onNavigate('Explore', activePlanet)}
                >
                  <Telescope size={14} />
                  Inspect in 3D
                  <ArrowUpRight size={13} />
                </button>
              )}
              {onNavigate && activePlanet.id !== 'earth' && (
                <button
                  type="button"
                  className="esi-action-btn"
                  onClick={() => onNavigate('Compare', activePlanet)}
                >
                  <Globe2 size={14} />
                  Compare with Earth
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Measurement Availability & Environmental Factors */}
          <div className="measurements-checklist-pane">
            <div className="pane-title-row">
              <h4>Observational Metrics & Constraints for {activePlanet.name}</h4>
              <span className={`hab-pill hab-${activeZone.toLowerCase()}`}>
                {activeZone} Habitable Zone
              </span>
            </div>

            <p className="pane-summary">{activePlanet.description}</p>

            <div className="metrics-availability-list">
              {/* Radius */}
              <div className="avail-row">
                <div className="avail-label">
                  {activePlanet.radius_earth ? (
                    <CheckCircle2 size={16} className="text-green" />
                  ) : (
                    <XCircle size={16} className="text-amber" />
                  )}
                  <span>Planetary Radius</span>
                </div>
                <b>{activePlanet.radius_earth ? `${activePlanet.radius_earth} R⊕` : 'Unmeasured'}</b>
                <small>{activePlanet.radius_earth ? 'Confirmed via transit photometry' : 'Pending observation'}</small>
              </div>

              {/* Mass */}
              <div className="avail-row">
                <div className="avail-label">
                  {activePlanet.mass_earth ? (
                    <CheckCircle2 size={16} className="text-green" />
                  ) : (
                    <XCircle size={16} className="text-amber" />
                  )}
                  <span>Planetary Mass</span>
                </div>
                <b className={activePlanet.mass_earth ? '' : 'text-muted'}>
                  {activePlanet.mass_earth ? `${activePlanet.mass_earth} M⊕` : 'Unmeasured'}
                </b>
                <small>
                  {activePlanet.mass_earth
                    ? 'Confirmed via radial velocity'
                    : 'Requires high-precision spectroscopy'}
                </small>
              </div>

              {/* Equilibrium Temperature */}
              <div className="avail-row">
                <div className="avail-label">
                  {activePlanet.equilibrium_temperature_k ? (
                    <CheckCircle2 size={16} className="text-green" />
                  ) : (
                    <XCircle size={16} className="text-amber" />
                  )}
                  <span>Equilibrium Temperature</span>
                </div>
                <b>
                  {activePlanet.equilibrium_temperature_k
                    ? `${activePlanet.equilibrium_temperature_k} K`
                    : 'Unmeasured'}
                </b>
                <small>
                  {activePlanet.equilibrium_temperature_k
                    ? activePlanet.equilibrium_temperature_k >= 250 && activePlanet.equilibrium_temperature_k <= 320
                      ? 'Within liquid water window'
                      : 'Outside temperate range'
                    : 'Stellar flux estimate pending'}
                </small>
              </div>

              {/* Orbital Period */}
              <div className="avail-row">
                <div className="avail-label">
                  <CheckCircle2 size={16} className="text-green" />
                  <span>Orbital Period</span>
                </div>
                <b>{activePlanet.orbital_period_days ? `${activePlanet.orbital_period_days} days` : 'Unmeasured'}</b>
                <small>Confirmed periodicity</small>
              </div>
            </div>

            {/* Stellar Host Context */}
            <div className="host-star-card">
              <Zap size={15} />
              <div>
                <b>Host Star: {activePlanet.host_star}</b>
                <p>
                  Distance: <b>{activePlanet.distance_pc ? `${activePlanet.distance_pc} pc` : 'Unmeasured'}</b>.
                  Stellar spectral class and superflare activity dictate long-term atmospheric preservation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recharts Distribution Charts */}
      <section className="insights-charts-section">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">CATALOGUE POPULATION METRICS <span>—</span> RECHARTS ENGINE</div>
            <h3>Distribution Across Mapped Systems</h3>
          </div>
        </div>

        <div className="charts-grid">
          {/* Chart 1: Habitability Zone Population */}
          <div className="chart-box">
            <h4>Habitability Zone Population</h4>
            <p>Count of planets across Conservative, Optimistic, and Hostile zones</p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={zoneChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <YAxis stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {zoneChartData.map((entry, index) => (
                      <Cell key={`cell-zone-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Planetary Classification */}
          <div className="chart-box">
            <h4>Planetary Classification Breakdown</h4>
            <p>Distribution by planetary archetype and size class</p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={classChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <YAxis stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {classChartData.map((entry, index) => (
                      <Cell key={`cell-class-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-footer">
        <span>EXOVERSE HABITABILITY LAB <i>·</i> PLANETARY HABITABILITY LABORATORY METHODS</span>
        <span>Habitability indicators describe orbital mechanics and potential, not biological proof.</span>
      </footer>
    </div>
  )
}
