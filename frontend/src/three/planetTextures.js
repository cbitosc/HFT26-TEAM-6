import * as THREE from 'three'

// Simple deterministic 2D Simplex/Perlin-style noise generator
function createNoise2D(seed = 42) {
  const perm = new Uint8Array(512)
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  for (let i = 0; i < 256; i++) {
    s = (s * 16807) % 2147483647
    perm[i] = s & 255
    perm[i + 256] = perm[i]
  }

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  function lerp(a, b, t) {
    return a + t * (b - a)
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

function fbm(noise, x, y, octaves = 5, lacunarity = 2.0, gain = 0.5) {
  let total = 0
  let frequency = 1.0
  let amplitude = 1.0
  let maxValue = 0
  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    frequency *= lacunarity
    amplitude *= gain
  }
  return total / maxValue
}

// Memory cache so we don't re-create textures on every render
const textureCache = new Map()

/**
 * Determine the visual archetype of an exoplanet
 */
export function getPlanetArchetype(planet, fallbackType = '') {
  const typeStr = ((planet?.planet_type || planet?.type || fallbackType || '') + ' ' + (planet?.name || '')).toLowerCase()
  const temp = planet?.equilibrium_temperature_k || (typeof planet?.temperature === 'number' ? planet.temperature : null)
  const radius = planet?.radius_earth || (typeof planet?.radius === 'number' ? planet.radius : null)

  if (typeStr.includes('lava') || typeStr.includes('magma') || typeStr.includes('volcanic') || typeStr.includes('55 cancri') || (temp && temp > 1400)) {
    return 'lava'
  }
  if (typeStr.includes('gas') || typeStr.includes('jovian') || typeStr.includes('jupiter') || typeStr.includes('wasp') || (radius && radius > 4)) {
    return 'gas_giant'
  }
  if (typeStr.includes('ice') || typeStr.includes('frozen') || typeStr.includes('cryo') || typeStr.includes('gliese 436') || (temp && temp < 160)) {
    return 'ice'
  }
  if (typeStr.includes('desert') || typeStr.includes('arid') || typeStr.includes('proxima') || typeStr.includes('martian')) {
    return 'desert'
  }
  return 'terrestrial'
}

/**
 * Procedural texture generator using HTML5 Canvas & Three.js CanvasTexture
 */
export function generatePlanetTextures(archetype, baseColor = '#8bd6c3', seed = 42) {
  const cacheKey = `${archetype}_${baseColor}_${seed}`
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)
  }

  const width = 1024
  const height = 512
  const noise = createNoise2D(seed)

  // 1. Surface Canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // 2. Cloud Canvas (optional, for terrestrial worlds)
  let cloudsCanvas = null

  // 3. Emissive Canvas (for lava worlds)
  let emissiveCanvas = null

  const baseRGB = new THREE.Color(baseColor)

  if (archetype === 'gas_giant') {
    // --- GAS GIANT: Banded Zonal Jet Streams + Storm Vortices ---
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    const col1 = baseRGB.clone()
    const col2 = baseRGB.clone().offsetHSL(0.08, -0.15, 0.22)
    const col3 = baseRGB.clone().offsetHSL(-0.06, 0.25, -0.2)
    const colWhite = new THREE.Color('#f0ece1')

    const stormX = Math.floor(width * 0.42)
    const stormY = Math.floor(height * 0.62)
    const stormRadiusX = width * 0.08
    const stormRadiusY = height * 0.06

    for (let y = 0; y < height; y++) {
      const v = y / height
      // Latitude bands with turbulence
      const latWarp = fbm(noise, 0.5, v * 8, 4) * 0.12
      const bandVal = Math.sin((v + latWarp) * 32 + Math.sin(v * 16) * 1.5) * 0.5 + 0.5

      for (let x = 0; x < width; x++) {
        const u = x / width
        const fineNoise = fbm(noise, u * 12, v * 24, 4) * 0.25
        const t = Math.max(0, Math.min(1, bandVal + fineNoise))

        let r, g, b
        if (t < 0.4) {
          const m = t / 0.4
          r = THREE.MathUtils.lerp(col3.r, col1.r, m)
          g = THREE.MathUtils.lerp(col3.g, col1.g, m)
          b = THREE.MathUtils.lerp(col3.b, col1.b, m)
        } else if (t < 0.8) {
          const m = (t - 0.4) / 0.4
          r = THREE.MathUtils.lerp(col1.r, col2.r, m)
          g = THREE.MathUtils.lerp(col1.g, col2.g, m)
          b = THREE.MathUtils.lerp(col1.b, col2.b, m)
        } else {
          const m = (t - 0.8) / 0.2
          r = THREE.MathUtils.lerp(col2.r, colWhite.r, m)
          g = THREE.MathUtils.lerp(col2.g, colWhite.g, m)
          b = THREE.MathUtils.lerp(col2.b, colWhite.b, m)
        }

        // Great Storm Vortex
        const dx = (x - stormX) / stormRadiusX
        const dy = (y - stormY) / stormRadiusY
        const distSq = dx * dx + dy * dy
        if (distSq < 1.0) {
          const stormIntensity = Math.exp(-distSq * 2.5)
          const angle = Math.atan2(dy, dx)
          const swirl = Math.sin(angle * 3 + distSq * 8) * 0.5 + 0.5
          r = THREE.MathUtils.lerp(r, col3.r * 1.3, stormIntensity * (0.6 + 0.4 * swirl))
          g = THREE.MathUtils.lerp(g, col1.g * 0.7, stormIntensity)
          b = THREE.MathUtils.lerp(b, col2.b * 0.6, stormIntensity)
        }

        const idx = (y * width + x) * 4
        data[idx] = Math.min(255, Math.floor(r * 255))
        data[idx + 1] = Math.min(255, Math.floor(g * 255))
        data[idx + 2] = Math.min(255, Math.floor(b * 255))
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)

  } else if (archetype === 'lava') {
    // --- LAVA WORLD: Dark basalt crust with glowing magma fissures ---
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    emissiveCanvas = document.createElement('canvas')
    emissiveCanvas.width = width
    emissiveCanvas.height = height
    const emissiveCtx = emissiveCanvas.getContext('2d')
    const emissiveImgData = emissiveCtx.createImageData(width, height)
    const eData = emissiveImgData.data

    for (let y = 0; y < height; y++) {
      const v = y / height
      for (let x = 0; x < width; x++) {
        const u = x / width
        // Voronoi/fissure ridge noise
        const n1 = Math.abs(fbm(noise, u * 8, v * 8, 4))
        const n2 = Math.abs(fbm(noise, u * 16 + 1.2, v * 16 + 2.4, 3))
        const fissure = 1.0 - Math.min(n1, n2)

        // Basalt crust (dark charcoal/slate)
        const crustDark = 0.08 + fbm(noise, u * 4, v * 4, 3) * 0.06
        let r = crustDark * 1.2
        let g = crustDark * 0.9
        let b = crustDark * 0.9

        let er = 0
        let eg = 0
        let eb = 0

        // Fissure threshold
        if (fissure > 0.82) {
          const intensity = Math.pow((fissure - 0.82) / 0.18, 1.8)
          // Molten yellow/orange/red gradient
          r = THREE.MathUtils.lerp(r, 1.0, intensity)
          g = THREE.MathUtils.lerp(g, 0.45 * intensity + 0.1, intensity)
          b = THREE.MathUtils.lerp(b, 0.08, intensity)

          er = Math.min(255, Math.floor(r * 255 * intensity * 1.5))
          eg = Math.min(255, Math.floor(g * 255 * intensity * 1.2))
          eb = Math.min(255, Math.floor(0.1 * 255 * intensity))
        }

        const idx = (y * width + x) * 4
        data[idx] = Math.min(255, Math.floor(r * 255))
        data[idx + 1] = Math.min(255, Math.floor(g * 255))
        data[idx + 2] = Math.min(255, Math.floor(b * 255))
        data[idx + 3] = 255

        eData[idx] = er
        eData[idx + 1] = eg
        eData[idx + 2] = eb
        eData[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)
    emissiveCtx.putImageData(emissiveImgData, 0, 0)

  } else if (archetype === 'ice') {
    // --- ICE WORLD: Glacial ice sheets, frost, tectonic chasmata ---
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    const colDeepIce = new THREE.Color('#5894b8')
    const colBrightIce = new THREE.Color('#d4f1f9')
    const colFrost = new THREE.Color('#f5fdff')
    const colChasm = new THREE.Color('#214968')

    for (let y = 0; y < height; y++) {
      const v = y / height
      for (let x = 0; x < width; x++) {
        const u = x / width
        const terrain = fbm(noise, u * 5, v * 5, 5) * 0.5 + 0.5
        const chasmNoise = 1.0 - Math.abs(fbm(noise, u * 14, v * 14, 3))

        let r, g, b
        if (terrain < 0.45) {
          const t = terrain / 0.45
          r = THREE.MathUtils.lerp(colDeepIce.r, colBrightIce.r, t)
          g = THREE.MathUtils.lerp(colDeepIce.g, colBrightIce.g, t)
          b = THREE.MathUtils.lerp(colDeepIce.b, colBrightIce.b, t)
        } else {
          const t = (terrain - 0.45) / 0.55
          r = THREE.MathUtils.lerp(colBrightIce.r, colFrost.r, t)
          g = THREE.MathUtils.lerp(colBrightIce.g, colFrost.g, t)
          b = THREE.MathUtils.lerp(colBrightIce.b, colFrost.b, t)
        }

        // Cracks and crevasses
        if (chasmNoise > 0.88) {
          const cT = (chasmNoise - 0.88) / 0.12
          r = THREE.MathUtils.lerp(r, colChasm.r, cT * 0.7)
          g = THREE.MathUtils.lerp(g, colChasm.g, cT * 0.7)
          b = THREE.MathUtils.lerp(b, colChasm.b, cT * 0.7)
        }

        const idx = (y * width + x) * 4
        data[idx] = Math.min(255, Math.floor(r * 255))
        data[idx + 1] = Math.min(255, Math.floor(g * 255))
        data[idx + 2] = Math.min(255, Math.floor(b * 255))
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)

  } else if (archetype === 'desert') {
    // --- DESERT / ARID: Iron-rich sands, dunes, canyon networks ---
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    const colRust = new THREE.Color('#963d1a')
    const colSand = new THREE.Color('#d9822b')
    const colOchre = new THREE.Color('#dfad7a')
    const colCanyon = new THREE.Color('#4c1d0e')

    for (let y = 0; y < height; y++) {
      const v = y / height
      for (let x = 0; x < width; x++) {
        const u = x / width
        const dunes = fbm(noise, u * 8, v * 16, 4) * 0.5 + 0.5
        const canyon = 1.0 - Math.abs(fbm(noise, u * 6, v * 6, 3))

        let r = THREE.MathUtils.lerp(colRust.r, colSand.r, dunes)
        let g = THREE.MathUtils.lerp(colRust.g, colSand.g, dunes)
        let b = THREE.MathUtils.lerp(colRust.b, colSand.b, dunes)

        if (dunes > 0.7) {
          const t = (dunes - 0.7) / 0.3
          r = THREE.MathUtils.lerp(r, colOchre.r, t)
          g = THREE.MathUtils.lerp(g, colOchre.g, t)
          b = THREE.MathUtils.lerp(b, colOchre.b, t)
        }

        if (canyon > 0.85) {
          const t = (canyon - 0.85) / 0.15
          r = THREE.MathUtils.lerp(r, colCanyon.r, t * 0.75)
          g = THREE.MathUtils.lerp(g, colCanyon.g, t * 0.75)
          b = THREE.MathUtils.lerp(b, colCanyon.b, t * 0.75)
        }

        const idx = (y * width + x) * 4
        data[idx] = Math.min(255, Math.floor(r * 255))
        data[idx + 1] = Math.min(255, Math.floor(g * 255))
        data[idx + 2] = Math.min(255, Math.floor(b * 255))
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)

  } else {
    // --- TERRESTRIAL / HABITABLE: Oceans, Continents, Mountains, Polar Ice ---
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    const colOceanDeep = new THREE.Color('#0b2447')
    const colOceanShallow = new THREE.Color('#19376d')
    const colCoast = new THREE.Color('#576cbc')
    const colLandLow = baseRGB.clone().offsetHSL(-0.04, 0.1, -0.05)
    const colLandMid = new THREE.Color('#4d7c0f')
    const colMountain = new THREE.Color('#78583c')
    const colIce = new THREE.Color('#eef7fb')

    for (let y = 0; y < height; y++) {
      const v = y / height
      const isPolar = v < 0.1 || v > 0.9
      const polarDist = v < 0.1 ? (0.1 - v) / 0.1 : (v > 0.9 ? (v - 0.9) / 0.1 : 0)

      for (let x = 0; x < width; x++) {
        const u = x / width
        const heightVal = fbm(noise, u * 3.5, v * 3.5, 5) * 0.5 + 0.5

        let r, g, b
        if (heightVal < 0.44) {
          // Ocean
          const t = heightVal / 0.44
          r = THREE.MathUtils.lerp(colOceanDeep.r, colOceanShallow.r, t)
          g = THREE.MathUtils.lerp(colOceanDeep.g, colOceanShallow.g, t)
          b = THREE.MathUtils.lerp(colOceanDeep.b, colOceanShallow.b, t)
          if (heightVal > 0.40) {
            const coastT = (heightVal - 0.40) / 0.04
            r = THREE.MathUtils.lerp(r, colCoast.r, coastT * 0.5)
            g = THREE.MathUtils.lerp(g, colCoast.g, coastT * 0.5)
            b = THREE.MathUtils.lerp(b, colCoast.b, coastT * 0.5)
          }
        } else if (heightVal < 0.65) {
          // Lowland / Vegetation
          const t = (heightVal - 0.44) / 0.21
          r = THREE.MathUtils.lerp(colLandLow.r, colLandMid.r, t)
          g = THREE.MathUtils.lerp(colLandLow.g, colLandMid.g, t)
          b = THREE.MathUtils.lerp(colLandLow.b, colLandMid.b, t)
        } else {
          // Highlands / Mountains
          const t = (heightVal - 0.65) / 0.35
          r = THREE.MathUtils.lerp(colLandMid.r, colMountain.r, t)
          g = THREE.MathUtils.lerp(colLandMid.g, colMountain.g, t)
          b = THREE.MathUtils.lerp(colLandMid.b, colMountain.b, t)
        }

        // Polar ice caps
        if (isPolar) {
          r = THREE.MathUtils.lerp(r, colIce.r, polarDist * 0.92)
          g = THREE.MathUtils.lerp(g, colIce.g, polarDist * 0.92)
          b = THREE.MathUtils.lerp(b, colIce.b, polarDist * 0.92)
        }

        const idx = (y * width + x) * 4
        data[idx] = Math.min(255, Math.floor(r * 255))
        data[idx + 1] = Math.min(255, Math.floor(g * 255))
        data[idx + 2] = Math.min(255, Math.floor(b * 255))
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)

    // Dynamic Swirling Cloud Layer for Terrestrial
    cloudsCanvas = document.createElement('canvas')
    cloudsCanvas.width = width
    cloudsCanvas.height = height
    const cloudsCtx = cloudsCanvas.getContext('2d')
    const cloudsImgData = cloudsCtx.createImageData(width, height)
    const cData = cloudsImgData.data

    for (let y = 0; y < height; y++) {
      const v = y / height
      for (let x = 0; x < width; x++) {
        const u = x / width
        const cloudNoise = fbm(noise, u * 5 + 3.1, v * 5 + 7.4, 5) * 0.5 + 0.5
        const idx = (y * width + x) * 4
        if (cloudNoise > 0.52) {
          const alpha = Math.min(255, Math.floor(((cloudNoise - 0.52) / 0.48) * 230))
          cData[idx] = 255
          cData[idx + 1] = 255
          cData[idx + 2] = 255
          cData[idx + 3] = alpha
        } else {
          cData[idx + 3] = 0
        }
      }
    }
    cloudsCtx.putImageData(cloudsImgData, 0, 0)
  }

  // Create Three.js CanvasTexture instances
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  let cloudsTexture = null
  if (cloudsCanvas) {
    cloudsTexture = new THREE.CanvasTexture(cloudsCanvas)
    cloudsTexture.wrapS = THREE.RepeatWrapping
    cloudsTexture.wrapT = THREE.ClampToEdgeWrapping
  }

  let emissiveTexture = null
  if (emissiveCanvas) {
    emissiveTexture = new THREE.CanvasTexture(emissiveCanvas)
    emissiveTexture.wrapS = THREE.RepeatWrapping
    emissiveTexture.wrapT = THREE.ClampToEdgeWrapping
  }

  const result = {
    archetype,
    texture,
    cloudsTexture,
    emissiveTexture,
    roughness: archetype === 'ice' ? 0.25 : archetype === 'gas_giant' ? 0.95 : archetype === 'lava' ? 0.7 : 0.65,
    metalness: archetype === 'ice' ? 0.15 : 0.04,
    emissiveColor: archetype === 'lava' ? '#ff4d00' : '#000000',
    emissiveIntensity: archetype === 'lava' ? 1.6 : 0,
    atmosphereColor: archetype === 'lava' ? '#ff3b00' : archetype === 'ice' ? '#92d5ff' : archetype === 'gas_giant' ? baseColor : '#6bc5e8',
    atmosphereOpacity: archetype === 'gas_giant' ? 0.18 : 0.14,
  }

  textureCache.set(cacheKey, result)
  return result
}
