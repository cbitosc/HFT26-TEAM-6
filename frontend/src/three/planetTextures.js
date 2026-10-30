
import * as THREE from 'three'

// Deterministic noise generator
function createNoise2D(seed = 42) {
  const perm = new Uint8Array(512)
  let s = Math.abs(seed) % 2147483647

  if (s === 0) s = 42

  for (let i = 0; i < 256; i++) {
    s = (s * 16807) % 2147483647
    perm[i] = s & 255
    perm[i + 256] = perm[i]
  }

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  function grad(hash, x, y) {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }

  return function noise2D(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    const u = fade(xf)
    const v = fade(yf)

    const aa = perm[perm[X] + Y]
    const ab = perm[perm[X] + Y + 1]
    const ba = perm[perm[X + 1] + Y]
    const bb = perm[perm[X + 1] + Y + 1]

    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    )
  }
}

function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let total = 0
  let frequency = 1
  let amplitude = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    frequency *= lacunarity
    amplitude *= gain
  }

  return total / maxValue
}

function clamp(value) {
  return Math.max(0, Math.min(1, value))
}

function writePixel(data, index, color) {
  data[index] = Math.round(clamp(color.r) * 255)
  data[index + 1] = Math.round(clamp(color.g) * 255)
  data[index + 2] = Math.round(clamp(color.b) * 255)
  data[index + 3] = 255
}

function mixColors(a, b, amount) {
  return a.clone().lerp(b, clamp(amount))
}

// Different stable palettes for individual planets
function getPlanetPalette(baseColor, seed) {
  const base = new THREE.Color(baseColor)

  const hueShift = (((seed % 101) / 100) - 0.5) * 0.32
  const saturationShift = (((seed % 37) / 36) - 0.5) * 0.25
  const lightnessShift = (((seed % 29) / 28) - 0.5) * 0.16

  base.offsetHSL(hueShift, saturationShift, lightnessShift)

  return {
    primary: base,
    secondary: base.clone().offsetHSL(0.07, 0.12, 0.13),
    dark: base.clone().offsetHSL(-0.06, -0.08, -0.2),
    accent: base.clone().offsetHSL(0.16, 0.18, 0.05),
  }
}

const textureCache = new Map()

export function getPlanetArchetype(planet, fallbackType = '') {
  const typeStr = (
    (planet?.planet_type || planet?.type || fallbackType || '') +
    ' ' +
    (planet?.name || '')
  ).toLowerCase()

  const temp =
    planet?.equilibrium_temperature_k ??
    (typeof planet?.temperature === 'number' ? planet.temperature : null)

  const radius =
    planet?.radius_earth ??
    (typeof planet?.radius === 'number' ? planet.radius : null)

  if (
    typeStr.includes('lava') ||
    typeStr.includes('magma') ||
    typeStr.includes('volcanic') ||
    typeStr.includes('55 cancri') ||
    (temp !== null && temp !== undefined && temp > 1400)
  ) {
    return 'lava'
  }

  if (
    typeStr.includes('ice') ||
    typeStr.includes('frozen') ||
    typeStr.includes('cryo') ||
    typeStr.includes('gliese 436') ||
    (temp !== null && temp !== undefined && temp < 160)
  ) {
    return 'ice'
  }

  if (
    typeStr.includes('gas') ||
    typeStr.includes('jovian') ||
    typeStr.includes('jupiter') ||
    typeStr.includes('wasp') ||
    (radius !== null && radius !== undefined && radius > 4)
  ) {
    return 'gas_giant'
  }

  if (
    typeStr.includes('desert') ||
    typeStr.includes('arid') ||
    typeStr.includes('proxima') ||
    typeStr.includes('martian')
  ) {
    return 'desert'
  }

  return 'terrestrial'
}

export function generatePlanetTextures(
  archetype,
  baseColor = '#8bd6c3',
  seed = 42
) {
  const safeSeed = Math.abs(Math.floor(seed)) || 42
  const cacheKey = `${archetype}_${baseColor}_${safeSeed}`

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)
  }

  const width = 1024
  const height = 512
  const noise = createNoise2D(safeSeed)
  const palette = getPlanetPalette(baseColor, safeSeed)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  let cloudsCanvas = null
  let emissiveCanvas = null

  // GAS GIANT: atmospheric bands and storm patterns
  if (archetype === 'gas_giant') {
    const col1 = palette.primary
    const col2 = palette.secondary
    const col3 = palette.dark
    const col4 = palette.accent

    const stormX = width * (0.25 + (safeSeed % 50) / 100)
    const stormY = height * (0.35 + (safeSeed % 30) / 100)
    const stormRX = width * 0.075
    const stormRY = height * 0.09

    const bandCount = 22 + (safeSeed % 12)

    for (let y = 0; y < height; y++) {
      const v = y / height
      const warp = fbm(noise, 0.5, v * 8, 4) * 0.12

      for (let x = 0; x < width; x++) {
        const u = x / width

        const band = Math.sin(
          (v + warp) * bandCount + Math.sin(v * 15) * 1.5
        ) * 0.5 + 0.5

        const detail = fbm(noise, u * 14, v * 25, 4) * 0.22
        const t = clamp(band + detail)

        let color

        if (t < 0.4) {
          color = mixColors(col3, col1, t / 0.4)
        } else if (t < 0.8) {
          color = mixColors(col1, col2, (t - 0.4) / 0.4)
        } else {
          color = mixColors(col2, col4, (t - 0.8) / 0.2)
        }

        // Seeded storm position and swirling appearance
        const dx = (x - stormX) / stormRX
        const dy = (y - stormY) / stormRY
        const distance = dx * dx + dy * dy

        if (distance < 1) {
          const intensity = Math.exp(-distance * 2.5)
          const angle = Math.atan2(dy, dx)
          const swirl = Math.sin(angle * 3 + distance * 8) * 0.5 + 0.5

          const stormColor = mixColors(
            col3,
            col4,
            0.4 + swirl * 0.4
          )

          color.lerp(stormColor, intensity * 0.8)
        }

        writePixel(data, (y * width + x) * 4, color)
      }
    }
  }

  // LAVA PLANET: dark volcanic surface and glowing fissures
  else if (archetype === 'lava') {
    emissiveCanvas = document.createElement('canvas')
    emissiveCanvas.width = width
    emissiveCanvas.height = height

    const emissiveCtx = emissiveCanvas.getContext('2d')
    const emissiveImg = emissiveCtx.createImageData(width, height)
    const eData = emissiveImg.data

    const crust = new THREE.Color('#171319')
    const lava = new THREE.Color('#ff4d00')
    const brightLava = new THREE.Color('#ffd166')

    const threshold = 0.77 + (safeSeed % 10) / 100

    for (let y = 0; y < height; y++) {
      const v = y / height

      for (let x = 0; x < width; x++) {
        const u = x / width

        const n1 = Math.abs(fbm(noise, u * 9, v * 9, 4))
        const n2 = Math.abs(fbm(noise, u * 18 + 1.2, v * 18 + 2.4, 3))
        const fissure = 1 - Math.min(n1, n2)

        const surfaceNoise = fbm(noise, u * 5, v * 5, 3)
        const color = crust.clone().multiplyScalar(
          0.8 + (surfaceNoise + 1) * 0.12
        )

        let glow = 0

        if (fissure > threshold) {
          glow = Math.pow(
            (fissure - threshold) / (1 - threshold),
            1.7
          )

          color.lerp(lava, glow)
          color.lerp(brightLava, glow * 0.25)
        }

        const index = (y * width + x) * 4
        writePixel(data, index, color)

        eData[index] = Math.round(glow * 255)
        eData[index + 1] = Math.round(glow * 95)
        eData[index + 2] = Math.round(glow * 12)
        eData[index + 3] = 255
      }
    }

    emissiveCtx.putImageData(emissiveImg, 0, 0)
  }

  // ICE PLANET: glaciers, frozen plains and dark cracks
  else if (archetype === 'ice') {
    const deepIce = palette.primary.clone().lerp(
      new THREE.Color('#214968'),
      0.35
    )

    const brightIce = palette.secondary.clone().lerp(
      new THREE.Color('#d4f1f9'),
      0.5
    )

    const frost = new THREE.Color('#f5fdff')
    const chasm = palette.dark.clone().lerp(
      new THREE.Color('#142c45'),
      0.5
    )

    for (let y = 0; y < height; y++) {
      const v = y / height

      for (let x = 0; x < width; x++) {
        const u = x / width

        const terrain = fbm(noise, u * 5, v * 5, 5) * 0.5 + 0.5
        const cracks = 1 - Math.abs(
          fbm(noise, u * 15, v * 15, 3)
        )

        let color

        if (terrain < 0.45) {
          color = mixColors(deepIce, brightIce, terrain / 0.45)
        } else {
          color = mixColors(
            brightIce,
            frost,
            (terrain - 0.45) / 0.55
          )
        }

        if (cracks > 0.87) {
          color.lerp(chasm, (cracks - 0.87) / 0.13 * 0.8)
        }

        writePixel(data, (y * width + x) * 4, color)
      }
    }
  }

  // DESERT PLANET: dunes, dry plains and canyon patterns
  else if (archetype === 'desert') {
    const rust = palette.dark.clone().lerp(
      new THREE.Color('#963d1a'),
      0.45
    )

    const sand = palette.primary.clone().lerp(
      new THREE.Color('#d9822b'),
      0.35
    )

    const ochre = palette.secondary.clone().lerp(
      new THREE.Color('#dfad7a'),
      0.4
    )

    const canyon = new THREE.Color('#4c1d0e')

    for (let y = 0; y < height; y++) {
      const v = y / height

      for (let x = 0; x < width; x++) {
        const u = x / width

        const dunes = fbm(noise, u * 8, v * 16, 4) * 0.5 + 0.5
        const canyonNoise = 1 - Math.abs(
          fbm(noise, u * 6, v * 6, 3)
        )

        let color = mixColors(rust, sand, dunes)

        if (dunes > 0.7) {
          color.lerp(ochre, (dunes - 0.7) / 0.3)
        }

        if (canyonNoise > 0.85) {
          color.lerp(canyon, (canyonNoise - 0.85) / 0.15 * 0.75)
        }

        writePixel(data, (y * width + x) * 4, color)
      }
    }
  }

  // TERRESTRIAL PLANET: oceans, land, mountains and polar ice
  else {
    const oceanDeep = new THREE.Color('#0b2447')
    const oceanShallow = new THREE.Color('#19376d')
    const coast = palette.accent.clone()

    const landLow = palette.primary.clone().offsetHSL(
      -0.04,
      0.1,
      -0.05
    )

    const landMid = palette.secondary.clone()
    const mountain = palette.dark.clone()
    const polarIce = new THREE.Color('#eef7fb')

    for (let y = 0; y < height; y++) {
      const v = y / height

      const isPolar = v < 0.1 || v > 0.9
      const polarDistance = v < 0.1
        ? (0.1 - v) / 0.1
        : v > 0.9
          ? (v - 0.9) / 0.1
          : 0

      for (let x = 0; x < width; x++) {
        const u = x / width

        const terrain = fbm(noise, u * 3.5, v * 3.5, 5) * 0.5 + 0.5

        let color

        if (terrain < 0.44) {
          color = mixColors(
            oceanDeep,
            oceanShallow,
            terrain / 0.44
          )

          if (terrain > 0.4) {
            color.lerp(coast, ((terrain - 0.4) / 0.04) * 0.5)
          }
        } else if (terrain < 0.65) {
          color = mixColors(
            landLow,
            landMid,
            (terrain - 0.44) / 0.21
          )
        } else {
          color = mixColors(
            landMid,
            mountain,
            (terrain - 0.65) / 0.35
          )
        }

        if (isPolar) {
          color.lerp(polarIce, polarDistance * 0.92)
        }

        writePixel(data, (y * width + x) * 4, color)
      }
    }

    // Independent cloud layer
    cloudsCanvas = document.createElement('canvas')
    cloudsCanvas.width = width
    cloudsCanvas.height = height

    const cloudsCtx = cloudsCanvas.getContext('2d')
    const cloudImg = cloudsCtx.createImageData(width, height)
    const cloudData = cloudImg.data

    for (let y = 0; y < height; y++) {
      const v = y / height

      for (let x = 0; x < width; x++) {
        const u = x / width

        const cloudNoise = fbm(
          noise,
          u * 5 + 3.1,
          v * 5 + 7.4,
          5
        ) * 0.5 + 0.5

        const index = (y * width + x) * 4

        cloudData[index] = 255
        cloudData[index + 1] = 255
        cloudData[index + 2] = 255

        cloudData[index + 3] = cloudNoise > 0.52
          ? Math.round(
              clamp((cloudNoise - 0.52) / 0.48) * 230
            )
          : 0
      }
    }

    cloudsCtx.putImageData(cloudImg, 0, 0)
  }

  ctx.putImageData(imgData, 0, 0)

  // Create Three.js textures
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace

  let cloudsTexture = null

  if (cloudsCanvas) {
    cloudsTexture = new THREE.CanvasTexture(cloudsCanvas)
    cloudsTexture.wrapS = THREE.RepeatWrapping
    cloudsTexture.wrapT = THREE.ClampToEdgeWrapping
    cloudsTexture.colorSpace = THREE.SRGBColorSpace
  }

  let emissiveTexture = null

  if (emissiveCanvas) {
    emissiveTexture = new THREE.CanvasTexture(emissiveCanvas)
    emissiveTexture.wrapS = THREE.RepeatWrapping
    emissiveTexture.wrapT = THREE.ClampToEdgeWrapping
    emissiveTexture.colorSpace = THREE.SRGBColorSpace
  }

  const result = {
    archetype,
    texture,
    cloudsTexture,
    emissiveTexture,

    roughness:
      archetype === 'ice' ? 0.25 :
      archetype === 'gas_giant' ? 0.95 :
      archetype === 'lava' ? 0.7 : 0.65,

    metalness: archetype === 'ice' ? 0.15 : 0.04,

    emissiveColor: archetype === 'lava' ? '#ff4d00' : '#000000',
    emissiveIntensity: archetype === 'lava' ? 1.6 : 0,

    atmosphereColor:
      archetype === 'lava' ? '#ff3b00' :
      archetype === 'ice' ? '#92d5ff' :
      archetype === 'gas_giant' ? baseColor :
      '#6bc5e8',

    atmosphereOpacity: archetype === 'gas_giant' ? 0.18 : 0.14,
  }

  textureCache.set(cacheKey, result)
  return result
}
