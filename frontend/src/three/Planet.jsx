import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generatePlanetTextures, getPlanetArchetype } from './planetTextures'

export default function Planet({
  planet = null,
  type = '',
  color = '#8bd6c3',
  hasRings = false,
  visionMode = 'visible',
}) {
  const planetRef = useRef()
  const cloudsRef = useRef()
  const atmosphereRef = useRef()

  const archetype = useMemo(() => {
    return getPlanetArchetype(planet, type)
  }, [planet, type])

  // Derive unique seed from planet name or color
  const seed = useMemo(() => {
    const str = (planet?.name || '') + (planet?.star || '') + color
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
    }
    return Math.abs(h) || 42
  }, [planet, color])

  const {
    texture,
    cloudsTexture,
    emissiveTexture,
    roughness,
    metalness,
    emissiveColor,
    emissiveIntensity,
    atmosphereColor,
    atmosphereOpacity,
  } = useMemo(() => {
    return generatePlanetTextures(archetype, color, seed)
  }, [archetype, color, seed])

  // Atmosphere color ref for smooth lerping
  const targetAtmoColor = useRef(new THREE.Color(atmosphereColor))
  targetAtmoColor.current.set(atmosphereColor)

  useFrame((_, delta) => {
    // Rotate planet surface
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.12
    }
    // Rotate clouds at independent rate for depth
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.16
    }
    // Lerp atmosphere color
    if (atmosphereRef.current) {
      atmosphereRef.current.color.lerp(targetAtmoColor.current, 1 - Math.exp(-delta * 4))
    }
  })

  // Whether to show rings (Gas Giants with hasRings or explicitly enabled)
  const showRings = hasRings || planet?.has_rings || (archetype === 'gas_giant' && (seed % 3 === 0))

  return (
    <group>
      {/* 1. Base Planet Surface */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        {visionMode === 'thermal' ? (
          <meshStandardMaterial
            color={
              (planet?.equilibrium_temperature_k || 188) > 1000
                ? '#ff3838'
                : (planet?.equilibrium_temperature_k || 188) > 350
                ? '#ff9f1a'
                : (planet?.equilibrium_temperature_k || 188) > 220
                ? '#2ed573'
                : '#1e90ff'
            }
            roughness={0.2}
            metalness={0.8}
            emissive={
              (planet?.equilibrium_temperature_k || 188) > 1000
                ? '#ff4757'
                : (planet?.equilibrium_temperature_k || 188) > 350
                ? '#ffa502'
                : (planet?.equilibrium_temperature_k || 188) > 220
                ? '#2ed573'
                : '#00d2d3'
            }
            emissiveIntensity={0.65}
          />
        ) : (
          <meshStandardMaterial
            map={texture}
            roughness={roughness}
            metalness={metalness}
            emissive={emissiveColor}
            emissiveMap={emissiveTexture || null}
            emissiveIntensity={emissiveIntensity}
          />
        )}
      </mesh>

      {/* 1b. Thermal Latitude Grid Scanner Overlay */}
      {visionMode === 'thermal' && (
        <mesh scale={1.004}>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.18}
          />
        </mesh>
      )}

      {/* 2. Dynamic Clouds Layer (for Terrestrial / Habitable worlds) */}
      {cloudsTexture && (
        <mesh ref={cloudsRef} scale={1.022}>
          <sphereGeometry args={[1.5, 48, 48]} />
          <meshStandardMaterial
            map={cloudsTexture}
            transparent
            opacity={visionMode === 'atmosphere' ? 0.95 : 0.7}
            blending={THREE.NormalBlending}
            depthWrite={false}
            emissive={visionMode === 'atmosphere' ? '#8bd6c3' : '#000000'}
            emissiveIntensity={visionMode === 'atmosphere' ? 0.45 : 0}
          />
        </mesh>
      )}

      {/* 2b. Atmospheric Spectroscopy Shell (when in atmosphere mode) */}
      {visionMode === 'atmosphere' && (
        <mesh scale={1.055}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial
            color="#8bd6c3"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* 3. Planetary Rings (Optional for Gas Giants / Ringed Worlds) */}
      {showRings && (
        <mesh rotation={[-Math.PI / 2.3, 0.25, 0]}>
          <ringGeometry args={[1.9, 3.1, 64]} />
          <meshStandardMaterial
            color={color}
            roughness={0.9}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. Atmospheric Haze / Outer Glow */}
      <mesh scale={1.075}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial
          ref={atmosphereRef}
          color={atmosphereColor}
          transparent
          opacity={atmosphereOpacity}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
