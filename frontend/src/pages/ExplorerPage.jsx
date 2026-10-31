
import {
  ArrowUpRight,
  Compass,
  Orbit,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'

import PlanetScene from '../three/PlanetScene'
import PlanetDetailsPanel from '../components/PlanetDetailsPanel'
import SearchAutocomplete from '../components/SearchAutocomplete'
import PlanetThumbnail from '../components/PlanetThumbnail'

export default function ExplorerPage({
  worlds,
  visibleWorlds,
  selected,
  setSelected,
  query,
  setQuery,
  onNavigate,
  onExport,
  totalPlanets = worlds.length,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  loadingPlanets = false,
  searching = false,
}) {
  const selectedIndex = worlds.findIndex(
    (world) => world.id === selected?.id
  )

  const handleSelectPlanet = (world) => {
    setSelected(world)
    const stage = document.getElementById('explorer-stage')
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
          <span>CONFIRMED PLANETS</span>
          <b>{totalPlanets.toLocaleString('en-IN')}</b>
          <small>NASA archive entries</small>
        </div>
      </section>

      {/* Search Autocomplete */}
      <SearchAutocomplete
        query={query}
        setQuery={setQuery}
        worlds={worlds}
        selected={selected}
        onSelectPlanet={handleSelectPlanet}
        placeholder="Search by planet name, host star, or type (e.g. Kepler, TRAPPIST, Lava)..."
      />

      {/* Main 3D Stage and Details */}
      <section className="explorer-card explore-feature" id="explorer-stage">
        <div className="scene-column">
          <div className="scene-topline">
            <span>
              <span className="live-pip" />
              INTERACTIVE 3D PLANET VIEW
            </span>

            <span className="scene-index">
              {selectedIndex >= 0
                ? String(selectedIndex + 1).padStart(2, '0')
                : '--'}

              <i> / </i>

              {worlds.length.toLocaleString('en-IN')}
            </span>
          </div>

          <div
            className="planet-stage"
            style={{
              '--world-color': selected?.color || '#8bd6c3',
            }}
          >
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="scene-glow" />

            <PlanetScene
              planets={null}
              selectedPlanet={selected}
              onSelectPlanet={setSelected}
              color={selected?.color || '#8bd6c3'}
              type={selected?.planet_type || selected?.type || ''}
            />
          </div>

          <div className="scene-foot">
            <span>
              DRAG TO ROTATE <i>·</i> SCROLL TO ZOOM
            </span>

            <span>ILLUSTRATIVE 3D RENDER</span>
          </div>
        </div>

        {/* Planet Details */}
        <PlanetDetailsPanel
          planet={selected}
          onNavigate={onNavigate}
          onExport={onExport}
          onCompare={(planet) => {
            if (onNavigate) {
              onNavigate('Compare', planet)
            }
          }}
        />
      </section>

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
            {query.trim()
              ? `${visibleWorlds.length} SEARCH RESULTS`
              : `${worlds.length} OF ${totalPlanets.toLocaleString('en-IN')} LOADED`}
          </span>
        </div>

        {searching && (
          <p className="loading-message">
            Searching the complete NASA catalogue...
          </p>
        )}

        {loadingPlanets && (
          <p className="loading-message">
            Loading confirmed exoplanets...
          </p>
        )}

        {visibleWorlds.length > 0 ? (
          <div className="target-grid">
            {visibleWorlds.map((world, index) => {
              const isSelected = selected?.id === world.id

              return (
                <button
                  key={world.id || world.name}
                  className={`target-card ${
                    isSelected ? 'target-active' : ''
                  }`}
                  style={{
                    '--orb-color': world.color || '#8bd6c3',
                  }}
                  onClick={() => handleSelectPlanet(world)}
                >
                  <span className="target-top">
                    <span className="target-number">
                      {String(index + 1).padStart(2, '0')}

                      <i>
                        {' '}
                        / {visibleWorlds.length.toLocaleString('en-IN')}
                      </i>
                    </span>

                    <ArrowUpRight size={15} />
                  </span>

                  <PlanetThumbnail planet={world} />

                  <b className="target-name">
                    {world.name}
                  </b>

                  <span className="target-type">
                    {world.planet_type || world.type || 'Exoplanet'}
                  </span>

                  <span className="target-meta">
                    <span>
                      {world.host_star || world.star || 'Unknown star'}
                    </span>

                    <span>
                      {world.distance_pc != null
                        ? `${world.distance_pc} pc`
                        : world.distance || 'Unknown distance'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : !searching && !loadingPlanets ? (
          <div className="empty-state">
            No worlds match "{query}"
          </div>
        ) : null}

        {/* Load More */}
        {!query.trim() && hasMore && (
          <div className="load-more-container">
            <button
              className="load-more-button"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore
                ? 'Loading more worlds...'
                : `Load More Worlds (${worlds.length} / ${totalPlanets.toLocaleString('en-IN')})`}
            </button>
          </div>
        )}

        {!query.trim() && !hasMore && worlds.length > 0 && (
          <p className="catalogue-complete">
            All {totalPlanets.toLocaleString('en-IN')} confirmed planets loaded.
          </p>
        )}
      </section>
    </div>
  )
}
