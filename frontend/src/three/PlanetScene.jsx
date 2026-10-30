import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Eye, Flame, Globe2, Layers, Radio, RotateCcw, Sparkles } from 'lucide-react'
import Planet from './Planet'
import { getPlanetArchetype } from './planetTextures'

// Smooth camera controller that transitions smoothly and then releases control
function CameraController({
  targetPosition,
  planetKey,
  isResetting,
  onResetComplete,
  controlsRef,
  planetScale = 1.0,
}) {
  const { camera } = useThree()
  const prevPlanetKey = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimer = useRef(null)

  useEffect(() => {
    if (planetKey && planetKey !== prevPlanetKey.current) {
      prevPlanetKey.current = planetKey
      setIsTransitioning(true)

      if (transitionTimer.current) clearTimeout(transitionTimer.current)
      transitionTimer.current = setTimeout(() => {
        setIsTransitioning(false)
      }, 1200)
    }
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    }
  }, [planetKey])

  useEffect(() => {
    if (isResetting) {
      prevPlanetKey.current = null
      setIsTransitioning(false)
    }
  }, [isResetting])

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    if (isResetting) {
      const defaultCam = new THREE.Vector3(0, 11, 24)
      const defaultLook = new THREE.Vector3(0, 0, 0)
      camera.position.lerp(defaultCam, delta * 3.2)
      controlsRef.current.target.lerp(defaultLook, delta * 3.2)
      controlsRef.current.update()

      if (camera.position.distanceTo(defaultCam) < 0.25) {
        onResetComplete()
      }
    } else if (isTransitioning && targetPosition) {
      const distOffset = Math.max(6.5, planetScale * 4.8 + 2.4)
      const targetLookAt = new THREE.Vector3(...targetPosition)
      const targetCam = new THREE.Vector3(
        targetPosition[0] + distOffset * 0.42,
        targetPosition[1] + distOffset * 0.28,
        targetPosition[2] + distOffset * 0.86
      )

      camera.position.lerp(targetCam, delta * 3.0)
      controlsRef.current.target.lerp(targetLookAt, delta * 3.0)
      controlsRef.current.update()

      if (camera.position.distanceTo(targetCam) < 0.18) {
        setIsTransitioning(false)
      }
    }
  })

  return null
}

// Luminous host star at the system center
function HostStar() {
  const starRef = useRef()

  useFrame((_, delta) => {
    if (starRef.current) {
      starRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={starRef}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="#ffeaa7" />
      </mesh>
      <mesh scale={1.22}>
        <sphereGeometry args={[1.25, 24, 24]} />
        <meshBasicMaterial
          color="#ffb142"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight intensity={32} distance={70} decay={1.8} color="#fff6e5" />
    </group>
  )
}

// Orbital trajectory guide line
function OrbitRing({ radius, isSelected }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.035, radius + 0.035, 96]} />
      <meshBasicMaterial
        color={isSelected ? '#c3d98b' : '#738a9c'}
        transparent
        opacity={isSelected ? 0.45 : 0.09}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Individual clickable planet in the 3D multi-planet scene
function InteractivePlanetNode({ item, isSelected, onSelect }) {
  const { planet, position, scale } = item
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group position={position} ref={groupRef}>
      <group
        scale={scale}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(planet)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          setHovered(true)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          setHovered(false)
        }}
      >
        <Planet
          planet={planet}
          color={planet.color}
          type={planet.planet_type || planet.type}
          hasRings={planet.has_rings || planet.hasRings}
        />
      </group>

      {isSelected && (
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <mesh scale={scale * 1.65}>
            <ringGeometry args={[1.14, 1.25, 48]} />
            <meshBasicMaterial
              color="#c3d98b"
              transparent
              opacity={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh scale={scale * 1.9}>
            <ringGeometry args={[1.18, 1.22, 48]} />
            <meshBasicMaterial
              color="#8bd6c3"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      <Html
        position={[0, scale * 1.6 + 0.35, 0]}
        center
        distanceFactor={22}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`scene-floating-label ${isSelected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}>
          <span className="label-pip" style={{ backgroundColor: planet.color }} />
          <span className="label-name">{planet.name}</span>
          {isSelected && <span className="label-target">SELECTED</span>}
        </div>
      </Html>
    </group>
  )
}

// 3D Earth companion rendered side-by-side with proportional scaling
function EarthScaleCompanion({ position = [-2.8, 0, 0], planetRadius = 1.17 }) {
  const earthRef = useRef()
  const cloudsRef = useRef()

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.14
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.18
  })

  // Proportional scale: Earth = 1.0 R⊕ (base 1.5 units)
  const baseScale = Math.max(0.35, Math.min(1.5, 1.5 / (planetRadius || 1.0)))

  return (
    <group position={position}>
      {/* Earth Surface Globe */}
      <mesh ref={earthRef} scale={baseScale}>
        <sphereGeometry args={[1.0, 48, 48]} />
        <meshStandardMaterial
          color="#1b5394"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Earth Continents (Green landmass layer) */}
      <mesh scale={baseScale * 1.002}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#387a38"
          roughness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Earth Clouds */}
      <mesh ref={cloudsRef} scale={baseScale * 1.025}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Blue Atmospheric Glow */}
      <mesh scale={baseScale * 1.08}>
        <sphereGeometry args={[1.0, 24, 24]} />
        <meshBasicMaterial
          color="#74b9ff"
          transparent
          opacity={0.25}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Floating 3D Label for Earth */}
      <Html position={[0, baseScale + 0.55, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
        <div className="earth-scale-pill">
          <span className="earth-dot" />
          <b>Earth Scale Benchmark</b>
          <small>1.00 R⊕ · 1.00 M⊕</small>
        </div>
      </Html>
    </group>
  )
}

// 3D Holographic Telemetry HUD: Equatorial caliper ring, polar axis, and dimension callouts
function PlanetTelemetryHUD({ planet, scale = 1.0 }) {
  const ringRef = useRef()

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.08
  })

  const radius = planet?.radius_earth || 1.17
  const temp = planet?.equilibrium_temperature_k || 188
  const period = planet?.orbital_period_days || 130
  const gravity = planet?.mass_earth
    ? (planet.mass_earth / Math.pow(radius, 2)).toFixed(2)
    : 'Unmeasured'

  return (
    <group>
      {/* Rotating Holographic Equatorial Measurement Ring */}
      <group rotation={[Math.PI / 2.2, 0, 0]} ref={ringRef}>
        <mesh>
          <ringGeometry args={[scale * 1.62, scale * 1.65, 64]} />
          <meshBasicMaterial color="#8bd6c3" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[scale * 1.72, scale * 1.74, 32]} />
          <meshBasicMaterial color="#c3d98b" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Polar Axis Reticle */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, scale * 1.9, 0, 0, -scale * 1.9, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#738a9c" transparent opacity={0.35} />
      </line>

      {/* 3D Floating Telemetry Callout: Radius */}
      <Html position={[scale * 1.8, scale * 0.8, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
        <div className="hud-callout hud-callout-radius">
          <span className="callout-tag">EQUATORIAL RADIUS</span>
          <b>{radius} R⊕</b>
          <small>{((radius / 1.0) * 100).toFixed(0)}% of Earth</small>
        </div>
      </Html>

      {/* 3D Floating Telemetry Callout: Temperature */}
      <Html position={[-scale * 1.8, -scale * 0.8, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
        <div className="hud-callout hud-callout-temp">
          <span className="callout-tag">EQUILIBRIUM TEMP</span>
          <b>{temp} K</b>
          <small>{temp < 200 ? 'Cryogenic' : temp < 350 ? 'Habitable zone' : 'Scorching'}</small>
        </div>
      </Html>

      {/* 3D Floating Telemetry Callout: Surface Gravity */}
      <Html position={[scale * 1.8, -scale * 0.8, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
        <div className="hud-callout hud-callout-gravity">
          <span className="callout-tag">SURFACE GRAVITY</span>
          <b>{gravity !== 'Unmeasured' ? `${gravity} g` : 'Pending'}</b>
          <small>{period} Earth days/yr</small>
        </div>
      </Html>
    </group>
  )
}

// 3D Dimension Caliper Line between Earth and Exoplanet
function ScaleCaliperLine({ start = [-2.8, 0, 0], end = [1.8, 0, 0], planetName, planetRadius }) {
  const ratio = (planetRadius || 1.0).toFixed(2)
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([...start, ...end])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#c3d98b" transparent opacity={0.35} />
      </line>

      <Html position={[(start[0] + end[0]) / 2, -1.9, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
        <div className="scale-ratio-badge">
          <b>{ratio}× EARTH RADIUS</b>
          <span>
            {planetName} is {ratio > 1 ? `${Math.round((ratio - 1) * 100)}% larger than Earth` : 'comparable to Earth'}
          </span>
        </div>
      </Html>
    </group>
  )
}

export default function PlanetScene({
  planets = null,
  selectedPlanet = null,
  onSelectPlanet = null,
  planet = null,
  color = '#8bd6c3',
  type = '',
}) {
  const controlsRef = useRef()
  const [isResetting, setIsResetting] = useState(false)
  const [visionMode, setVisionMode] = useState('visible') // 'visible' | 'thermal' | 'atmosphere'
  const [showEarthScale, setShowEarthScale] = useState(false)
  const [showTelemetry, setShowTelemetry] = useState(true)

  const activePlanet = selectedPlanet || planet
  const activeColor = activePlanet?.color || color || '#8bd6c3'
  const archetype = getPlanetArchetype(activePlanet, type)

  // Determine multi-planet system positions
  const systemPlanets = useMemo(() => {
    if (!planets || planets.length === 0) return null

    return planets.map((p, idx) => {
      const orbitRadius = 4.2 + idx * 2.5
      const angle = idx * 1.3 + 0.35
      const x = Math.cos(angle) * orbitRadius
      const z = Math.sin(angle) * orbitRadius
      const y = Math.sin(idx * 1.6) * 0.45

      const isGas = p.planet_type?.toLowerCase().includes('gas') || (p.radius_earth && p.radius_earth > 10)
      const isIce = p.planet_type?.toLowerCase().includes('ice') || (p.radius_earth && p.radius_earth > 3)
      const scale = isGas ? 1.35 : isIce ? 1.05 : 0.8

      return {
        planet: p,
        position: [x, y, z],
        orbitRadius,
        scale,
      }
    })
  }, [planets])

  const selectedNode = useMemo(() => {
    if (!systemPlanets || !activePlanet) return null
    return systemPlanets.find((item) => item.planet.name === activePlanet.name) || null
  }, [systemPlanets, activePlanet])

  const handleResetCamera = () => {
    setIsResetting(true)
  }

  const archetypeNameMap = {
    terrestrial: 'Terrestrial World',
    gas_giant: 'Gas Giant (Jovian)',
    lava: 'Lava World (Volcanic)',
    ice: 'Cryoplanet (Ice World)',
    desert: 'Arid / Desert World',
  }

  return (
    <div className="scene-canvas">
      <Canvas
        camera={{ position: [0, 11, 24], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#080c10']} />

        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 6]} intensity={2.2} />
        <directionalLight position={[-6, -4, -6]} intensity={0.35} color="#85a3cf" />

        <Stars
          radius={95}
          depth={60}
          count={2400}
          factor={3.8}
          saturation={0.35}
          fade
          speed={0.4}
        />

        <CameraController
          targetPosition={selectedNode?.position || null}
          planetKey={activePlanet?.name || null}
          planetScale={selectedNode?.scale || 1.0}
          isResetting={isResetting}
          onResetComplete={() => setIsResetting(false)}
          controlsRef={controlsRef}
        />

        {systemPlanets ? (
          <group>
            <HostStar />
            {systemPlanets.map((item) => (
              <OrbitRing
                key={`orbit-${item.planet.name}`}
                radius={item.orbitRadius}
                isSelected={activePlanet?.name === item.planet.name}
              />
            ))}
            {systemPlanets.map((item) => (
              <InteractivePlanetNode
                key={`planet-${item.planet.name}`}
                item={item}
                isSelected={activePlanet?.name === item.planet.name}
                onSelect={(p) => {
                  setIsResetting(false)
                  if (onSelectPlanet) onSelectPlanet(p)
                }}
              />
            ))}
          </group>
        ) : (
          /* Focused Single Planet with Interactive Visualizations */
          <group>
            {/* Exoplanet in Focus */}
            <group position={showEarthScale ? [1.8, 0, 0] : [0, 0, 0]}>
              <Planet
                planet={activePlanet}
                color={activeColor}
                type={type}
                hasRings={activePlanet?.has_rings || activePlanet?.hasRings}
                visionMode={visionMode}
              />

              {/* 3D Telemetry HUD (Equatorial ring & dimension callouts) */}
              {showTelemetry && !showEarthScale && (
                <PlanetTelemetryHUD planet={activePlanet} scale={1.0} />
              )}
            </group>

            {/* Side-by-side 3D Earth scale comparison */}
            {showEarthScale && (
              <>
                <EarthScaleCompanion
                  position={[-2.8, 0, 0]}
                  planetRadius={activePlanet?.radius_earth || 1.17}
                />
                <ScaleCaliperLine
                  start={[-2.8, 0, 0]}
                  end={[1.8, 0, 0]}
                  planetName={activePlanet?.name || 'Target'}
                  planetRadius={activePlanet?.radius_earth || 1.17}
                />
              </>
            )}
          </group>
        )}

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          panSpeed={0.6}
          zoomSpeed={1.0}
          minDistance={1.8}
          maxDistance={65}
          enableDamping={true}
          dampingFactor={0.06}
          rotateSpeed={0.7}
        />
      </Canvas>

      {/* Floating Canvas UI Controls & Header */}
      <div className="scene-overlay-controls">
        <div className="scene-controls-left">
          <div className="scene-archetype-tag">
            <Sparkles size={11} />
            <span>{archetypeNameMap[archetype] || 'Exoplanet'}</span>
          </div>

          {/* Multi-Spectral Vision Mode Toggles */}
          <div className="scene-mode-selector">
            <button
              type="button"
              className={`mode-btn ${visionMode === 'visible' ? 'active' : ''}`}
              onClick={() => setVisionMode('visible')}
              title="Natural visible light spectrum"
            >
              <Eye size={11} />
              <span>Visible</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${visionMode === 'thermal' ? 'active' : ''}`}
              onClick={() => setVisionMode('thermal')}
              title="Thermal infrared false-color heatmap"
            >
              <Flame size={11} />
              <span>Thermal IR</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${visionMode === 'atmosphere' ? 'active' : ''}`}
              onClick={() => setVisionMode('atmosphere')}
              title="Atmospheric spectroscopy scan"
            >
              <Layers size={11} />
              <span>Atmosphere</span>
            </button>
          </div>
        </div>

        <div className="scene-controls-right">
          {/* Earth Scale Comparison Toggle */}
          <button
            type="button"
            className={`scene-tool-btn ${showEarthScale ? 'active' : ''}`}
            onClick={() => setShowEarthScale(!showEarthScale)}
            title="Toggle side-by-side Earth scale comparison"
          >
            <Globe2 size={12} />
            <span>{showEarthScale ? 'Hide Earth' : '⊕ Compare Scale'}</span>
          </button>

          {/* Telemetry HUD Toggle */}
          <button
            type="button"
            className={`scene-tool-btn ${showTelemetry ? 'active' : ''}`}
            onClick={() => setShowTelemetry(!showTelemetry)}
            title="Toggle 3D Telemetry callouts"
          >
            <Radio size={12} />
            <span>HUD</span>
          </button>

          <button
            type="button"
            className="scene-reset-btn"
            onClick={handleResetCamera}
            title="Reset Camera View to System Overview"
            aria-label="Reset Camera"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Thermal IR Spectrum Indicator Banner when Thermal mode is active */}
      {visionMode === 'thermal' && (
        <div className="scene-thermal-banner">
          <span>THERMAL SENSOR ACTIVE</span>
          <div className="thermal-legend-strip">
            <span className="legend-cold">Cold (&lt;200 K)</span>
            <span className="legend-hab">Temperate (288 K)</span>
            <span className="legend-hot">Scorching (&gt;1000 K)</span>
          </div>
        </div>
      )}
    </div>
  )
}
