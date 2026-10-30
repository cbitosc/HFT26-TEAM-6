import { ArrowUpRight, Compass, Orbit, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import PlanetScene from '../three/PlanetScene'
import PlanetDetailsPanel from '../components/PlanetDetailsPanel'

export default function ExplorerPage({
  worlds,
  visibleWorlds,
  selected,
  setSelected,
  query,
  setQuery,
  onNavigate,
}) {
  return (
    <div className="content-wrap explore-page">
      {/* Header */}
      <section className="page-heading explore-heading">
        <div>
          <div className="eyebrow">EXOPLANET CATALOGUE <span>—</span> INTERACTIVE 3D EXPLORER</div>
          <h1>Explore <em>Solar Systems.</em></h1>
          <p>Rotate the 3D space environment, click any planet to lock-on, or search across NASA records.</p>
        </div>
        <div className="heading-index">
          <span>IN THIS SYSTEM</span>
          <b>{String(visibleWorlds.length).padStart(2, '0')}</b>
          <small>worlds mapped</small>
        </div>
      </section>

      {/* Search Bar */}
      <label className="search-box explore-search">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by planet name, host star, or type (e.g. Kepler, TRAPPIST, Lava)..."
        />
        <span>⌘ K</span>
      </label>

      {/* Main 3D Stage & Scientific Details Panel */}
      <section className="explorer-card explore-feature">
        <div className="scene-column">
          <div className="scene-topline">
            <span>
              <span className="live-pip" />
              INTERACTIVE 3D SYSTEM
            </span>
            <span className="scene-index">
              {String(worlds.findIndex((world) => world.name === selected.name) + 1).padStart(2, '0')}
              <i> / </i>
              {String(worlds.length).padStart(2, '0')}
            </span>
          </div>

          <div className="planet-stage" style={{ '--world-color': selected.color }}>
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="scene-glow" />

            {/* Multi-planet interactive 3D scene */}
            <PlanetScene
              planets={visibleWorlds}
              selectedPlanet={selected}
              onSelectPlanet={setSelected}
              color={selected.color}
              type={selected.planet_type || selected.type}
            />
          </div>

          <div className="scene-foot">
            <span>DRAG TO ROTATE <i>·</i> SCROLL TO ZOOM <i>·</i> CLICK PLANET TO FOCUS</span>
            <span>ILLUSTRATIVE 3D RENDER</span>
          </div>
        </div>

        {/* Standard NASA Scientific Planet Details Panel */}
        <PlanetDetailsPanel
          planet={selected}
          onNavigate={onNavigate}
          onCompare={(p) => {
            if (onNavigate) onNavigate('Compare', p)
          }}
        />
      </section>

      {/* Grid of Planet Target Cards */}
      <section className="explore-results">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">TARGET LIST <span>—</span> NASA EXOPLANET ARCHIVE</div>
            <h3>Select a destination</h3>
          </div>
          <span className="results-count">
            {visibleWorlds.length} {visibleWorlds.length === 1 ? 'RESULT' : 'RESULTS'}
          </span>
        </div>

        {visibleWorlds.length ? (
          <div className="target-grid">
            {visibleWorlds.map((world, index) => {
              const isSelected = selected.name === world.name
              return (
                <button
                  key={world.name}
                  className={`target-card ${isSelected ? 'target-active' : ''}`}
                  style={{ '--orb-color': world.color }}
                  onClick={() => setSelected(world)}
                >
                  <span className="target-top">
                    <span className="target-number">
                      0{index + 1} <i>/ {String(worlds.length).padStart(2, '0')}</i>
                    </span>
                    <ArrowUpRight size={15} />
                  </span>

                  <span className="target-planet" style={{ '--orb-color': world.color }} />
                  <b className="target-name">{world.name}</b>
                  <span className="target-type">{world.planet_type || world.type}</span>

                  <span className="target-meta">
                    <span>{world.host_star || world.star}</span>
                    <span>{world.distance_pc ? `${world.distance_pc} pc` : world.distance}</span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            No worlds match “{query}”. Try searching by star name (e.g., “Kepler” or “TRAPPIST”) or planet type.
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>EXOVERSE FIELD GUIDE <i>·</i> NASA EXOPLANET ARCHIVE INTEGRATION</span>
        <span>Appearance and size are illustrative, not to scale. Actual measurements derived from NASA data.</span>
      </footer>
    </div>
  )
}
