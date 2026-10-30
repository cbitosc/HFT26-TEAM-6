import { useMemo, useState } from 'react'
import {
  ArrowLeftRight, ArrowUpRight, Award, Compass, Globe2,
  Info, Orbit, Sparkles, Telescope, Thermometer, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, Cell
} from 'recharts'
import { EARTH_BENCHMARK } from '../services/api'

export default function ComparePage({
  worlds = [],
  initialPlanetA = null,
  initialPlanetB = null,
  onNavigate,
}) {
  // Pool of available planets includes Earth benchmark + all catalog worlds
  const availableWorlds = useMemo(() => {
    const list = [EARTH_BENCHMARK, ...worlds.filter((w) => w.id !== 'earth')]
    return list
  }, [worlds])

  const [planetAId, setPlanetAId] = useState(
    initialPlanetA?.id || availableWorlds[1]?.id || 'kepler-186-f'
  )
  const [planetBId, setPlanetBId] = useState(
    initialPlanetB?.id || availableWorlds[0]?.id || 'earth' // Default comparison with Earth!
  )

  const planetA = useMemo(() => {
    return availableWorlds.find((w) => w.id === planetAId) || availableWorlds[1] || availableWorlds[0]
  }, [availableWorlds, planetAId])

  const planetB = useMemo(() => {
    return availableWorlds.find((w) => w.id === planetBId) || availableWorlds[0]
  }, [availableWorlds, planetBId])

  // Swap planets
  const handleSwap = () => {
    setPlanetAId(planetB.id)
    setPlanetBId(planetA.id)
  }

  // Quick preset: Compare Planet A with Earth
  const handleSetEarthB = () => {
    setPlanetBId('earth')
  }

  // Consistent missing measurement helper (strictly 'Unmeasured' - Task #2)
  const formatVal = (val, unit = '') => (val != null ? `${val} ${unit}`.trim() : 'Unmeasured')

  // Difference Calculations & Highlights
  const diffs = useMemo(() => {
    const rA = planetA.radius_earth
    const rB = planetB.radius_earth
    const mA = planetA.mass_earth
    const mB = planetB.mass_earth
    const tA = planetA.equilibrium_temperature_k
    const tB = planetB.equilibrium_temperature_k
    const pA = planetA.orbital_period_days
    const pB = planetB.orbital_period_days

    let radiusDiffText = 'Comparison unavailable'
    if (rA && rB) {
      if (rA > rB) {
        const ratio = (rA / rB).toFixed(2)
        radiusDiffText = `${planetA.name} is ${ratio}x larger (${((rA - rB) / rB * 100).toFixed(0)}% > ${planetB.name})`
      } else if (rB > rA) {
        const ratio = (rB / rA).toFixed(2)
        radiusDiffText = `${planetB.name} is ${ratio}x larger (${((rB - rA) / rA * 100).toFixed(0)}% > ${planetA.name})`
      } else {
        radiusDiffText = 'Identical radii'
      }
    }

    let tempDiffText = 'Temperature delta unmeasured'
    if (tA && tB) {
      const delta = Math.abs(tA - tB)
      const hotter = tA > tB ? planetA.name : planetB.name
      tempDiffText = `${hotter} is ${delta} K hotter`
    }

    let massDiffText = 'Mass delta unmeasured'
    if (mA && mB) {
      if (mA > mB) {
        massDiffText = `${planetA.name} is ${(mA / mB).toFixed(1)}x more massive`
      } else if (mB > mA) {
        massDiffText = `${planetB.name} is ${(mB / mA).toFixed(1)}x more massive`
      } else {
        massDiffText = 'Identical mass'
      }
    }

    return { radiusDiffText, tempDiffText, massDiffText }
  }, [planetA, planetB])

  // Recharts Chart Data
  const dimensionChartData = useMemo(() => {
    return [
      {
        metric: 'Radius (R⊕)',
        [planetA.name]: planetA.radius_earth || 0,
        [planetB.name]: planetB.radius_earth || 0,
      },
      {
        metric: 'Mass (M⊕)',
        [planetA.name]: planetA.mass_earth || 0,
        [planetB.name]: planetB.mass_earth || 0,
      },
    ]
  }, [planetA, planetB])

  const environmentChartData = useMemo(() => {
    return [
      {
        metric: 'Equilibrium Temp (K)',
        [planetA.name]: planetA.equilibrium_temperature_k || 0,
        [planetB.name]: planetB.equilibrium_temperature_k || 0,
      },
      {
        metric: 'Orbital Period (Days)',
        [planetA.name]: planetA.orbital_period_days || 0,
        [planetB.name]: planetB.orbital_period_days || 0,
      },
    ]
  }, [planetA, planetB])

  // Habitability classes & badges (Conservative | Optimistic | Hostile - Task #3)
  const getHabClass = (h) => {
    const val = (h || 'Hostile').toLowerCase()
    if (val.includes('conservative')) return 'hab-conservative'
    if (val.includes('optimistic')) return 'hab-optimistic'
    return 'hab-hostile'
  }

  // Custom Dark Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <b>{label}</b>
          {payload.map((entry, idx) => (
            <div key={`tooltip-${idx}`} style={{ color: entry.color }}>
              <span>{entry.name}: </span>
              <strong>{entry.value === 0 ? 'Unmeasured' : entry.value}</strong>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="content-wrap compare-page">
      {/* Header */}
      <section className="page-heading">
        <div>
          <div className="eyebrow">CROSS-SYSTEM ANALYSIS <span>—</span> COMPARATIVE METRICS</div>
          <h1>Compare <em>Worlds.</em></h1>
          <p>Examine physical scales, atmospheric temperatures, and orbital properties side-by-side.</p>
        </div>
        <div className="heading-index">
          <span>ACTIVE COMPARISON</span>
          <b>02</b>
          <small>worlds aligned</small>
        </div>
      </section>

      {/* Selectors Bar */}
      <section className="compare-selector-bar">
        <div className="selector-group">
          <label>PLANET A</label>
          <div className="custom-select-wrap">
            <span className="select-orb" style={{ backgroundColor: planetA.color }} />
            <select
              value={planetAId}
              onChange={(e) => setPlanetAId(e.target.value)}
              className="compare-select"
            >
              {availableWorlds.map((w) => (
                <option key={`a-${w.id}`} value={w.id}>
                  {w.name} ({w.host_star})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="swap-planets-btn"
          onClick={handleSwap}
          title="Swap Planet A and Planet B"
        >
          <ArrowLeftRight size={16} />
          <span>SWAP</span>
        </button>

        <div className="selector-group">
          <label>PLANET B</label>
          <div className="custom-select-wrap">
            <span className="select-orb" style={{ backgroundColor: planetB.color }} />
            <select
              value={planetBId}
              onChange={(e) => setPlanetBId(e.target.value)}
              className="compare-select"
            >
              {availableWorlds.map((w) => (
                <option key={`b-${w.id}`} value={w.id}>
                  {w.name} ({w.host_star})
                </option>
              ))}
            </select>
          </div>
        </div>

        {planetB.id !== 'earth' && (
          <button
            type="button"
            className="preset-earth-btn"
            onClick={handleSetEarthB}
            title="Preselect Earth as Planet B"
          >
            <Globe2 size={14} />
            <span>Reset B to Earth</span>
          </button>
        )}
      </section>

      {/* Difference Highlight Summary Pills */}
      <section className="diff-pills-bar">
        <div className="diff-pill">
          <Sparkles size={13} />
          <span>{diffs.radiusDiffText}</span>
        </div>
        <div className="diff-pill">
          <Thermometer size={13} />
          <span>{diffs.tempDiffText}</span>
        </div>
        <div className="diff-pill">
          <Zap size={13} />
          <span>{diffs.massDiffText}</span>
        </div>
      </section>

      {/* Side-by-Side Cards */}
      <section className="compare-grid">
        {/* Planet A Card */}
        <div className="compare-card" style={{ '--accent-color': planetA.color }}>
          <div className="card-topline">
            <span className="card-tag">TARGET ALPHA</span>
            <span className={`hab-pill ${getHabClass(planetA.habitability)}`}>
              {planetA.habitability || 'Hostile'}
            </span>
          </div>

          <div className="card-hero">
            <div className="card-orb" style={{ backgroundColor: planetA.color }} />
            <div>
              <h2>{planetA.name}</h2>
              <p>Host Star: <b>{planetA.host_star}</b></p>
            </div>
          </div>

          <p className="card-desc">{planetA.description}</p>

          <div className="rule" />

          <div className="compare-metrics-list">
            <div className="metric-row">
              <span>Radius (Earth Radii)</span>
              <b>{formatVal(planetA.radius_earth, 'R⊕')}</b>
            </div>
            <div className="metric-row">
              <span>Mass (Earth Masses)</span>
              <b>{formatVal(planetA.mass_earth, 'M⊕')}</b>
            </div>
            <div className="metric-row">
              <span>Equilibrium Temperature</span>
              <b>{formatVal(planetA.equilibrium_temperature_k, 'K')}</b>
            </div>
            <div className="metric-row">
              <span>Orbital Period</span>
              <b>{formatVal(planetA.orbital_period_days, 'days')}</b>
            </div>
            <div className="metric-row">
              <span>Distance From Earth</span>
              <b>{formatVal(planetA.distance_pc, 'pc')}</b>
            </div>
            <div className="metric-row">
              <span>Discovery Year</span>
              <b>{planetA.discovery_year || 'Unmeasured'}</b>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              className="card-action-btn"
              onClick={() => onNavigate('Explore', planetA)}
            >
              <Telescope size={14} />
              Inspect {planetA.name} in 3D
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>

        {/* Planet B Card */}
        <div className="compare-card" style={{ '--accent-color': planetB.color }}>
          <div className="card-topline">
            <span className="card-tag">TARGET BETA</span>
            <span className={`hab-pill ${getHabClass(planetB.habitability)}`}>
              {planetB.habitability || 'Hostile'}
            </span>
          </div>

          <div className="card-hero">
            <div className="card-orb" style={{ backgroundColor: planetB.color }} />
            <div>
              <h2>{planetB.name}</h2>
              <p>Host Star: <b>{planetB.host_star}</b></p>
            </div>
          </div>

          <p className="card-desc">{planetB.description}</p>

          <div className="rule" />

          <div className="compare-metrics-list">
            <div className="metric-row">
              <span>Radius (Earth Radii)</span>
              <b>{formatVal(planetB.radius_earth, 'R⊕')}</b>
            </div>
            <div className="metric-row">
              <span>Mass (Earth Masses)</span>
              <b>{formatVal(planetB.mass_earth, 'M⊕')}</b>
            </div>
            <div className="metric-row">
              <span>Equilibrium Temperature</span>
              <b>{formatVal(planetB.equilibrium_temperature_k, 'K')}</b>
            </div>
            <div className="metric-row">
              <span>Orbital Period</span>
              <b>{formatVal(planetB.orbital_period_days, 'days')}</b>
            </div>
            <div className="metric-row">
              <span>Distance From Earth</span>
              <b>{formatVal(planetB.distance_pc, 'pc')}</b>
            </div>
            <div className="metric-row">
              <span>Discovery Year</span>
              <b>{planetB.discovery_year || 'Unmeasured'}</b>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              className="card-action-btn"
              onClick={() => onNavigate('Explore', planetB)}
            >
              <Telescope size={14} />
              Inspect {planetB.name} in 3D
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      </section>

      {/* Visual Recharts Comparative Charts */}
      <section className="compare-charts-section">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">VISUAL CROSS-EXAMINATION <span>—</span> RECHARTS ENGINE</div>
            <h3>Comparative Metrics Visualizer</h3>
          </div>
          <div className="chart-legend-pills">
            <span className="legend-pill" style={{ color: planetA.color }}>
              ● {planetA.name}
            </span>
            <span className="legend-pill" style={{ color: planetB.color }}>
              ● {planetB.name}
            </span>
          </div>
        </div>

        <div className="charts-grid">
          {/* Chart 1: Physical Scale */}
          <div className="chart-box">
            <h4>Physical Dimensions (Scale)</h4>
            <p>Direct comparison of planetary Radius ($R_\oplus$) and Mass ($M_\oplus$)</p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dimensionChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="metric" stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <YAxis stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={planetA.name} fill={planetA.color} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={planetB.name} fill={planetB.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Thermal & Orbital Period */}
          <div className="chart-box">
            <h4>Thermal & Orbital Environment</h4>
            <p>Equilibrium Temperature ($K$) and Orbital Period (days)</p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={environmentChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="metric" stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <YAxis stroke="#717970" tick={{ fill: '#9aa297', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={planetA.name} fill={planetA.color} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={planetB.name} fill={planetB.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* AI Cross-Examination Quick Banner */}
      {onNavigate && (
        <section className="ai-compare-banner">
          <div>
            <div className="ai-banner-tag">
              <Sparkles size={13} />
              <span>AI ASTRONOMER COMPARISON MODE</span>
            </div>
            <h3>Need scientific analysis comparing {planetA.name} and {planetB.name}?</h3>
            <p>Consult the virtual astronomer to explain physical discrepancies, tidal locking potential, and radiation exposure.</p>
          </div>
          <button
            type="button"
            className="ai-compare-btn"
            onClick={() => onNavigate('Astronomer', { planetA, planetB })}
          >
            <Sparkles size={15} />
            Ask AI to Compare Both Worlds
            <ArrowUpRight size={14} />
          </button>
        </section>
      )}

      {/* Footer */}
      <footer className="page-footer">
        <span>EXOVERSE COMPARATIVE LAB <i>·</i> RECHARTS DATA VISUALIZER</span>
        <span>Appearance and size are illustrative, not to scale. Actual measurements derived from NASA Exoplanet Archive.</span>
      </footer>
    </div>
  )
}
