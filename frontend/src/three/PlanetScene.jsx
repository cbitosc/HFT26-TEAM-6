import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Planet from './Planet'

// Shifts camera projection so the focal planet is centered in the left 58% unobstructed viewport
function ResponsiveViewOffset() {
  const { camera, size } = useThree()

  useEffect(() => {
    const panelWidth = size.width > 900 ? Math.min(440, size.width * 0.42) : 0
    if (panelWidth > 0) {
      camera.setViewOffset(size.width, size.height, panelWidth / 2, 0, size.width, size.height)
    } else {
      camera.clearViewOffset()
    }
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

// Smooth camera controller: glides on planet change, then frees OrbitControls for 360° mouse navigation
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

  // Trigger camera flight only when a new planet is selected
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
      // Return to system overview: host star centered in open left viewport
      const defaultCam = new THREE.Vector3(0, 12, 26)
      const defaultLook = new THREE.Vector3(0, 0, 0)
      camera.position.lerp(defaultCam, delta * 3.5)
      controlsRef.current.target.lerp(defaultLook, delta * 3.5)
      controlsRef.current.update()

      if (camera.position.distanceTo(defaultCam) < 0.25) {
        onResetComplete()
      }
    } else if (isTransitioning && targetPosition) {
      // Calculate comfortable viewing distance based on planet radius/rings
      const distOffset = Math.max(6.8, planetScale * 5.0 + 2.5)
      const targetLookAt = new THREE.Vector3(...targetPosition)
      const targetCam = new THREE.Vector3(
        targetPosition[0] + distOffset * 0.35,
        targetPosition[1] + distOffset * 0.30,
        targetPosition[2] + distOffset * 0.88
      )

      camera.position.lerp(targetCam, delta * 3.2)
      controlsRef.current.target.lerp(targetLookAt, delta * 3.2)
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
      {/* Corona glow halo */}
      <mesh scale={1.22}>
        <sphereGeometry args={[1.25, 24, 24]} />
        <meshBasicMaterial
          color="#ffb142"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Solar light radiating outward */}
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
      {/* Planet Model & Click Target */}
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

      {/* Holographic Selection Ring when selected */}
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

      {/* Floating 3D Billboard Name Label */}
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

export default function PlanetScene({
  planets = null,
  selectedPlanet = null,
  onSelectPlanet = null,
  planet = null,
  color = '#8bd6c3',
  type = '',
  resetSignal = 0,
}) {
  const controlsRef = useRef()
  const [isResetting, setIsResetting] = useState(false)
  const prevResetSignal = useRef(resetSignal)

  // Listen to external reset requests from UI
  useEffect(() => {
    if (resetSignal > prevResetSignal.current) {
      prevResetSignal.current = resetSignal
      setIsResetting(true)
    }
  }, [resetSignal])

  // Current active planet
  const activePlanet = selectedPlanet || planet
  const activeColor = activePlanet?.color || color || '#8bd6c3'

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

  // Selected planet's position & scale for camera framing
  const selectedNode = useMemo(() => {
    if (!systemPlanets || !activePlanet) return null
    return systemPlanets.find((item) => item.planet.name === activePlanet.name) || null
  }, [systemPlanets, activePlanet])

  return (
    <div className="scene-canvas">
      <Canvas
        camera={{ position: [0, 12, 26], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#080c10']} />

        {/* View offset so planet is centered in the open left observatory viewport */}
        <ResponsiveViewOffset />

        {/* Ambient & Rim Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 6]} intensity={2.2} />
        <directionalLight position={[-6, -4, -6]} intensity={0.35} color="#85a3cf" />

        {/* Deep Field Starfield */}
        <Stars
          radius={95}
          depth={60}
          count={2600}
          factor={3.8}
          saturation={0.35}
          fade
          speed={0.4}
        />

        {/* Camera flight controller */}
        <CameraController
          targetPosition={selectedNode?.position || null}
          planetKey={activePlanet?.name || null}
          planetScale={selectedNode?.scale || 1.0}
          isResetting={isResetting}
          onResetComplete={() => setIsResetting(false)}
          controlsRef={controlsRef}
        />

        {/* Multi-planet system or single-planet preview */}
        {systemPlanets ? (
          <group>
            {/* Host Star & Sunlight */}
            <HostStar />

            {/* Orbit lines */}
            {systemPlanets.map((item) => (
              <OrbitRing
                key={`orbit-${item.planet.name}`}
                radius={item.orbitRadius}
                isSelected={activePlanet?.name === item.planet.name}
              />
            ))}

            {/* Clickable Planets in 3D Space */}
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
          <group>
            <Planet
              planet={activePlanet}
              color={activeColor}
              type={type}
              hasRings={activePlanet?.has_rings || activePlanet?.hasRings}
            />
          </group>
        )}

        {/* Camera Orbit Controls: Free zooming and panning with smooth damping */}
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
    </div>
  )
}
