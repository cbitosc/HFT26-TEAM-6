import { ArrowUpRight, Search } from 'lucide-react'
import ObservatoryStage from '../components/ObservatoryStage'

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
          <div className="eyebrow">
            EXOPLANET CATALOGUE <span>—</span> INTERACTIVE 3D EXPLORER
          </div>

          <h1>
            Explore <em>Solar Systems.</em>
          </h1>

          <p>
            Rotate the 3D space environment, or search across NASA records.
          </p>
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
          placeholder="Search by planet name, host star, or type..."
        />

        <span>⌘ K</span>
      </label>

      {/* Unified Organic Observatory Stage */}
      <ObservatoryStage
        planets={visibleWorlds}
        selectedPlanet={selected}
        onSelectPlanet={setSelected}
        onNavigate={onNavigate}
        onCompare={(planet) => {
          if (onNavigate) {
            onNavigate('Compare', planet)
          }
        }}
        statusLabel="OPTICAL TELEMETRY · 3D ORBITAL MAPPING"
      />

      {/* Planet Catalogue */}
      <section className="explore-results">
        <div className="catalogue-heading">
          <div>
            <div className="eyebrow">
              TARGET LIST <span>—</span> NASA EXOPLANET ARCHIVE
            </div>

            <h3>Select a destination</h3>
          </div>

          <span className="results-count">
            {visibleWorlds.length}{' '}
            {visibleWorlds.length === 1 ? 'RESULT' : 'RESULTS'}
          </span>
        </div>

        {visibleWorlds.length > 0 ? (
          <div className="target-grid">
            {visibleWorlds.map((world, index) => {
              const isSelected = selected.name === world.name

              return (
                <button
                  key={world.name}
                  className={`target-card ${
                    isSelected ? 'target-active' : ''
                  }`}
                  style={{ '--orb-color': world.color }}
                  onClick={() => setSelected(world)}
                >
                  <span className="target-top">
                    <span className="target-number">
                      {String(index + 1).padStart(2, '0')}

                      <i>
                        {' '}
                        / {String(worlds.length).padStart(2, '0')}
                      </i>
                    </span>

                    <ArrowUpRight size={15} />
                  </span>

                  <span
                    className="target-planet"
                    style={{ '--orb-color': world.color }}
                  />

                  <b className="target-name">{world.name}</b>

                  <span className="target-type">
                    {world.planet_type || world.type || 'Exoplanet'}
                  </span>

                  <span className="target-meta">
                    <span>
                      {world.host_star || world.star || 'Unknown star'}
                    </span>

                    <span>
                      {world.distance_pc
                        ? `${world.distance_pc} pc`
                        : world.distance || 'Unknown distance'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            No worlds match "{query}"
          </div>
        )}
      </section>
    </div>
  )
}