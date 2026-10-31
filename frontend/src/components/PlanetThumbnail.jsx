
import { useEffect, useMemo, useRef } from 'react'
import {
  generatePlanetTextures,
  getPlanetArchetype,
} from '../three/planetTextures'

export default function PlanetThumbnail({ planet }) {
  const canvasRef = useRef(null)

  const color = planet?.color || '#8bd6c3'

  const archetype = useMemo(
    () => getPlanetArchetype(planet),
    [planet]
  )

  const seed = useMemo(() => {
    const str =
      (planet?.name || '') +
      (planet?.star || planet?.host_star || '') +
      color

    let hash = 0

    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
    }

    return Math.abs(hash) || 42
  }, [planet, color])

  const textureData = useMemo(
    () => generatePlanetTextures(archetype, color, seed),
    [archetype, color, seed]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const source = textureData.texture?.image

    if (!canvas || !source) return

    const size = 128
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    const sourceCanvas = document.createElement('canvas')

    sourceCanvas.width = source.width
    sourceCanvas.height = source.height

    const sourceCtx = sourceCanvas.getContext('2d')
    sourceCtx.drawImage(source, 0, 0)

    const sourcePixels = sourceCtx.getImageData(
      0,
      0,
      source.width,
      source.height
    ).data

    const output = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x - size / 2) / (size / 2)
        const ny = (y - size / 2) / (size / 2)

        const distance = nx * nx + ny * ny

        const index = (y * size + x) * 4

        if (distance > 1) {
          output.data[index + 3] = 0
          continue
        }

        const nz = Math.sqrt(1 - distance)

        const longitude =
          (Math.atan2(nx, nz) / (2 * Math.PI) + 0.5) *
          source.width

        const latitude =
          (Math.asin(-ny) / Math.PI + 0.5) *
          source.height

        const sx = Math.min(
          source.width - 1,
          Math.max(0, Math.floor(longitude))
        )

        const sy = Math.min(
          source.height - 1,
          Math.max(0, Math.floor(latitude))
        )

        const sourceIndex =
          (sy * source.width + sx) * 4

        const light = Math.max(
          0.25,
          0.35 + 0.65 * (
            nx * -0.45 +
            ny * 0.45 +
            nz * 0.75
          )
        )

        output.data[index] =
          sourcePixels[sourceIndex] * light

        output.data[index + 1] =
          sourcePixels[sourceIndex + 1] * light

        output.data[index + 2] =
          sourcePixels[sourceIndex + 2] * light

        output.data[index + 3] = 255
      }
    }

    ctx.putImageData(output, 0, 0)
  }, [textureData])

  return (
    <span className="target-planet">
      <canvas
        ref={canvasRef}
        className="target-planet-canvas"
      />
      <span className="target-planet-glow" />
    </span>
  )
}
