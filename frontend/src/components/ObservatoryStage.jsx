import { useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import PlanetScene from '../three/PlanetScene'
import PlanetDetailsPanel from './PlanetDetailsPanel'
import { getPlanetArchetype } from '../three/planetTextures'

const archetypeNameMap = {
  terrestrial: 'Terrestrial World',
  gas_giant: 'Gas Giant (Jovian)',
  lava: 'Lava World (Volcanic)',
  ice: 'Cryoplanet (Ice World)',
  desert: 'Arid / Desert World',
}

export default function ObservatoryStage({
  planets,
  selectedPlanet,
  onSelectPlanet,
  onNavigate,
  onCompare,
  onExport,
  statusLabel = 'OPTICAL TELEMETRY · 3D ORBITAL MAPPING',
}) {
  const [resetSignal, setResetSignal] = useState(0)

  const archetype = getPlanetArchetype(
    selectedPlanet,
    selectedPlanet?.planet_type || selectedPlanet?.type
  )

  const handleResetCamera = () => {
    setResetSignal((prev) => prev + 1)
  }

  return (
    <section className="explorer-stage-unified" style={{ '--world-color': selectedPlanet.color }}>
      {/* Full-bleed 3D Cosmos */}
      <div className="stage-canvas-full">
        <PlanetScene
          planets={planets}
          selectedPlanet={selectedPlanet}
          onSelectPlanet={onSelectPlanet}
          color={selectedPlanet.color}
          type={selectedPlanet.planet_type || selectedPlanet.type}
          resetSignal={resetSignal}
        />
      </div>

      {/* Atmospheric planetary aura bleeding outward */}
      <div className="stage-aura-bleed" />

      {/* Top Left Mission HUD Controls (Reset Camera, Archetype, Telemetry Status) */}
      <div className="stage-top-hud">
        <button
          type="button"
          className="stage-reset-btn"
          onClick={handleResetCamera}
          title="Reset Camera View to Solar System Overview"
          aria-label="Reset Camera"
        >
          <RotateCcw size={12} />
          <span>Reset Camera</span>
        </button>

        <div className="stage-archetype-tag">
          <Sparkles size={11} />
          <span>{archetypeNameMap[archetype] || 'Exoplanet'}</span>
        </div>

        <div className="stage-telemetry-tag">
          <span className="live-pip" />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Frosted Optical Glass HUD Overlay (Right Column) */}
      <aside className="hud-telemetry-overlay">
        <PlanetDetailsPanel
          planet={selectedPlanet}
          onNavigate={onNavigate}
          onCompare={onCompare}
          onExport={onExport}
        />
      </aside>

      {/* Bottom Viewport HUD Navigation Hints */}
      <div className="stage-bottom-hud">
        <span>DRAG TO ROTATE 360° · SCROLL TO ZOOM · CLICK ANY WORLD TO LOCK TARGET</span>
      </div>
    </section>
  )
}
