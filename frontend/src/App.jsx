
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ChevronDown,
  CircleHelp,
  Compass,
  Command,
  Download,
  Globe2,
  Menu,
  Orbit,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

import ObservatoryStage from './components/ObservatoryStage'
import DidYouKnow from './components/DidYouKnow'
import ExportReportModal from './components/ExportReportModal'
import ExplorerPage from './pages/ExplorerPage'
import ComparePage from './pages/ComparePage'
import InsightsPage from './pages/InsightsPage'
import AstronomerPage from './pages/AstronomerPage'
import { getPlanetsPage, INITIAL_PLANETS } from './services/api'

import './App.css'
import './Palette.css'
import './pages/Explorer.css'

const PAGE_SIZE = 100

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

  const [totalPlanets, setTotalPlanets] = useState(INITIAL_PLANETS.length)
  const [loadingPlanets, setLoadingPlanets] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [compareData, setCompareData] = useState(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Load the first 100 planets from NASA.
  useEffect(() => {
    let isMounted = true

    async function loadInitialPlanets() {
      setLoadingPlanets(true)

      const result = await getPlanetsPage({
        limit: PAGE_SIZE,
        offset: 0,
      })

      if (!isMounted) return

      if (result.data.length > 0) {
        setWorlds(result.data)
        setTotalPlanets(result.total)
        setSelected(result.data[0])
      }

      setLoadingPlanets(false)
    }

    loadInitialPlanets()

    return () => {
      isMounted = false
    }
  }, [])

  // Search the complete NASA catalogue.
  useEffect(() => {
    let isMounted = true
    const searchText = query.trim()

    if (!searchText) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)

    const timer = setTimeout(async () => {
      const result = await getPlanetsPage({
        limit: 20,
        offset: 0,
        search: searchText,
      })

      if (isMounted) {
        setSearchResults(result.data)
        setSearching(false)
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [query])

  // Show NASA search results when searching.
  const visibleWorlds = useMemo(() => {
    return query.trim() ? searchResults : worlds
  }, [query, searchResults, worlds])

  // Load the next 100 planets.
  async function loadMorePlanets() {
    if (loadingMore || worlds.length >= totalPlanets) return

    setLoadingMore(true)

    try {
      const result = await getPlanetsPage({
        limit: PAGE_SIZE,
        offset: worlds.length,
      })

      if (result.data.length > 0) {
        setWorlds((previous) => {
          const existingIds = new Set(previous.map((planet) => planet.id))

          const newPlanets = result.data.filter(
            (planet) => !existingIds.has(planet.id)
          )

          return [...previous, ...newPlanets]
        })

        setTotalPlanets(result.total)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  function navigate(name, data = null) {
    setPage(name)

    if (name === 'Astronomer' && data?.planetA && data?.planetB) {
      setCompareData(data)
    } else if (data && data.name) {
      setSelected(data)
    }

    setMenuOpen(false)
  }

  function handleSelectPlanet(world) {
    setSelected(world)
    const stage = document.getElementById('overview-observatory-stage')
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const hasMore = worlds.length < totalPlanets

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => navigate('Overview')}>
          <span className="brand-mark">
            <Orbit size={20} strokeWidth={1.7} />
          </span>
          <span>
            <strong>AETHER</strong>
            <small>WHERE CURIOSITY MEETS THE COSMOS</small>
          </span>
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

          <button className="help-link">
            <CircleHelp size={16} />
            About this project
          </button>

          <div className="profile">
            <div className="profile-avatar">S</div>
            <span>
              <b>Research desk</b>
              <small>Independent observer</small>
            </span>
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

            <button
              type="button"
              className="export-top-btn"
              onClick={() => setExportModalOpen(true)}
              title="Build custom PDF, Word, or ZIP research dossier"
            >
              <Download size={13} />
              <span>Export Report</span>
            </button>

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
            onExport={() => setExportModalOpen(true)}
            totalPlanets={totalPlanets}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMorePlanets}
            loadingPlanets={loadingPlanets}
            searching={searching}
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
                <div className="eyebrow">
                AETHER 
                </div>

                <h2>
                  WHERE CURIOSITY MEETS THE COSMOS
                </h2>

                <p>
                  A living 3D catalogue of exoplanets mapped from NASA
                  observational missions.
                </p>
              </div>

              <div className="heading-index">
                <span>CATALOGUE WORLDS</span>
                <b>{totalPlanets.toLocaleString('en-IN')}</b>
                <small>confirmed entries</small>
              </div>
            </section>

            <div id="overview-observatory-stage">
              <ObservatoryStage
                planets={visibleWorlds}
                selectedPlanet={selected}
                onSelectPlanet={setSelected}
                onNavigate={navigate}
                onCompare={(planet) => navigate('Compare', planet)}
                onExport={() => setExportModalOpen(true)}
                statusLabel="OPTICAL TELEMETRY · FIELD OBSERVATION"
              />
            </div>
            <DidYouKnow />
            <section className="catalogue-section">
              <div className="catalogue-heading">
                <div>
                  <div className="eyebrow">
                    OBSERVATION LOG <span>—</span> CONFIRMED TARGETS
                  </div>
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

              {searching && (
                <p className="loading-message">
                  Searching the NASA catalogue...
                </p>
              )}

              {loadingPlanets && (
                <p className="loading-message">
                  Loading confirmed exoplanets...
                </p>
              )}

              <div className="world-list">
                {visibleWorlds.length > 0 ? (
                  visibleWorlds.map((world, index) => (
                    <button
                      className={`world-row ${
                        selected?.name === world.name ? 'world-selected' : ''
                      }`}
                      key={world.id || world.name}
                      onClick={() => handleSelectPlanet(world)}
                    >
                      <span className="row-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span
                        className="world-orb"
                        style={{ '--orb-color': world.color || '#8bd6c3' }}
                      />

                      <span className="world-name">
                        <b>{world.name}</b>
                        <small>{world.planet_type || world.type || 'Exoplanet'}</small>
                      </span>

                      <span className="world-host">
                        {world.host_star || world.star || 'Unknown star'}
                      </span>

                      <span className="world-distance">
                        {world.distance_pc != null
                          ? `${world.distance_pc} pc`
                          : world.distance ?? 'Unknown'}
                      </span>

                      <span className="row-arrow">
                        <ArrowDownRight size={16} />
                      </span>
                    </button>
                  ))
                ) : !searching && !loadingPlanets ? (
                  <div className="empty-state">
                    No worlds match "{query}"
                  </div>
                ) : null}
              </div>

              {!query.trim() && hasMore && (
                <div className="load-more-container">
                  <button
                    className="load-more-button"
                    onClick={loadMorePlanets}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? 'Loading more worlds...'
                      : `Load More (${worlds.length} of ${totalPlanets.toLocaleString('en-IN')})`}
                  </button>
                </div>
              )}

              {!query.trim() && !hasMore && worlds.length > 0 && (
                <p className="catalogue-complete">
                  All {totalPlanets.toLocaleString('en-IN')} confirmed worlds
                  loaded.
                </p>
              )}
            </section>
          </div>
        )}

        <ExportReportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          selectedPlanet={selected}
          worlds={worlds}
        />
      </main>
    </div>
  )
}
