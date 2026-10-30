import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, ChevronDown, CircleHelp,
  Compass, Command, Globe2, Menu, Orbit, Search, SlidersHorizontal,
  Sparkles, Telescope, X,
} from 'lucide-react'
import ObservatoryStage from './components/ObservatoryStage'
import PlanetDetailsPanel from './components/PlanetDetailsPanel'
import ExplorerPage from './pages/ExplorerPage'
import ComparePage from './pages/ComparePage'
import InsightsPage from './pages/InsightsPage'
import AstronomerPage from './pages/AstronomerPage'
import { getPlanets, INITIAL_PLANETS } from './services/api'
import './App.css'
import './Palette.css'
import './pages/Explorer.css'

const navItems = [
  { label: 'Overview', icon: Globe2 },
  { label: 'Explore', icon: Orbit },
  { label: 'Compare', icon: Activity },
  { label: 'Insights', icon: Compass },
  { label: 'Astronomer', icon: Sparkles },
]

export default function App() {
  const [page, setPage] = useState('Overview')
  const [query, setQuery] = useState('')
  const [worlds, setWorlds] = useState(INITIAL_PLANETS)
  const [selected, setSelected] = useState(INITIAL_PLANETS[0])
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch from FastAPI backend (or keep NASA mock catalogue fallback)
  useEffect(() => {
    let isMounted = true
    getPlanets().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setWorlds(data)
        if (!selected) setSelected(data[0])
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const visibleWorlds = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return worlds
    return worlds.filter((world) => {
      const name = world.name.toLowerCase()
      const star = (world.host_star || world.star || '').toLowerCase()
      const type = (world.planet_type || world.type || '').toLowerCase()
      return name.includes(q) || star.includes(q) || type.includes(q)
    })
  }, [worlds, query])

  const [compareData, setCompareData] = useState(null)

  function navigate(name, data = null) {
    setPage(name)
    if (name === 'Astronomer' && data?.planetA && data?.planetB) {
      setCompareData(data)
    } else if (data && data.name) {
      setSelected(data)
    }
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => navigate('Overview')}>
          <span className="brand-mark"><Orbit size={20} strokeWidth={1.7} /></span>
          <span><strong>EXOVERSE</strong><small>FIELD NOTES · 01</small></span>
        </button>

        <div className="side-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              onClick={() => navigate(label)}
              className={page === label ? 'nav-link active' : 'nav-link'}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span>{label}</span>
              {index === 0 && <span className="nav-count">01</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <b>Deep field online</b>
              <small>NASA Catalogue synced</small>
            </div>
          </div>
          <button className="help-link"><CircleHelp size={16} />About this project</button>
          <div className="profile">
            <div className="profile-avatar">S</div>
            <span><b>Research desk</b><small>Independent observer</small></span>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumbs">
            <span>CATALOGUE</span>
            <i>/</i>
            <b>{page.toUpperCase()}</b>
          </div>
          <div className="top-actions">
            <span className="data-note">
              <span className="status-dot" />
              NASA ARCHIVE ACTIVE
            </span>
            <button className="command-key" aria-label="Search">
              <Command size={14} />
              <span>K</span>
            </button>
          </div>
        </header>

        {page === 'Explore' ? (
          <ExplorerPage
            worlds={worlds}
            visibleWorlds={visibleWorlds}
            selected={selected}
            setSelected={setSelected}
            query={query}
            setQuery={setQuery}
            onNavigate={navigate}
          />
        ) : page === 'Compare' ? (
          <ComparePage
            worlds={worlds}
            initialPlanetA={selected}
            onNavigate={navigate}
          />
        ) : page === 'Insights' ? (
          <InsightsPage
            worlds={worlds}
            selectedPlanet={selected}
            onNavigate={navigate}
          />
        ) : page === 'Astronomer' ? (
          <AstronomerPage
            worlds={worlds}
            selectedPlanet={selected}
            initialCompare={compareData}
            onNavigate={navigate}
          />
        ) : (
          <div className="content-wrap">
            <section className="page-heading">
              <div>
                <div className="eyebrow">THE EXOPLANET FIELD GUIDE <span>—</span> VOL. 01</div>
                <h1>Worlds beyond <em>our own.</em></h1>
                <p>A living 3D catalogue of exoplanets mapped from NASA observational missions.</p>
              </div>
              <div className="heading-index">
                <span>CATALOGUE WORLDS</span>
                <b>{String(worlds.length).padStart(2, '0')}</b>
                <small>confirmed entries</small>
              </div>
            </section>

            {/* Unified Organic Observatory Stage */}
            <ObservatoryStage
              planets={visibleWorlds}
              selectedPlanet={selected}
              onSelectPlanet={setSelected}
              onNavigate={navigate}
              onCompare={(p) => navigate('Compare', p)}
              statusLabel="OPTICAL TELEMETRY · FIELD OBSERVATION"
            />

            {/* Observation Log Table */}
            <section className="catalogue-section">
              <div className="catalogue-heading">
                <div>
                  <div className="eyebrow">OBSERVATION LOG <span>—</span> CONFIRMED TARGETS</div>
                  <h3>Worlds to know</h3>
                </div>
                <label className="search-box">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a world, host star, or planet type..."
                  />
                  <span>⌘ K</span>
                </label>
              </div>

              <div className="world-list">
                {visibleWorlds.length ? (
                  visibleWorlds.map((world, index) => (
                    <button
                      className={`world-row ${selected.name === world.name ? 'world-selected' : ''}`}
                      key={world.name}
                      onClick={() => setSelected(world)}
                    >
                      <span className="row-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="world-orb" style={{ '--orb-color': world.color }} />
                      <span className="world-name">
                        <b>{world.name}</b>
                        <small>{world.planet_type || world.type}</small>
                      </span>
                      <span className="world-host">{world.host_star || world.star}</span>
                      <span className="world-distance">
                        {world.distance_pc != null ? `${world.distance_pc} pc` : world.distance}
                      </span>
                      <span className="row-arrow">
                        <ArrowDownRight size={16} />
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    No worlds match “{query}”. Try searching by star name or planet type.
                  </div>
                )}
              </div>

              <div className="catalogue-foot">
                <span>
                  SHOWING {visibleWorlds.length} OF {worlds.length} MAPPED WORLDS
                </span>
                <button onClick={() => navigate('Explore')}>
                  Browse 3D System Explorer <ArrowUpRight size={14} />
                </button>
              </div>
            </section>

            <footer className="page-footer">
              <span>EXOVERSE FIELD GUIDE <i>·</i> A WINDOW INTO OTHER SYSTEMS</span>
              <span>Appearance and size are illustrative, not to scale. Actual measurements derived from NASA data.</span>
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}
