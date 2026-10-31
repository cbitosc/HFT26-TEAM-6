import JSZip from 'jszip'

// Helper to trigger a browser file download
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Format metric safely
const fmt = (val, unit = '') => (val != null ? `${val}${unit ? ` ${unit}` : ''}` : 'Unmeasured')

// Safely parse numbers
const getNum = (val) => {
  if (val == null) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

/**
 * Generate rich scientific narrative & environmental metrics for a world
 */
export function generatePlanetSummary(planet) {
  const rad = getNum(planet.radius_earth || planet.radius)
  const mass = getNum(planet.mass_earth || planet.mass)
  const tempK = getNum(planet.equilibrium_temperature_k || planet.temperature)
  const period = getNum(planet.orbital_period_days || planet.period)
  const dist = getNum(planet.distance_pc || planet.distance)
  const hab = planet.habitability || 'Hostile'
  const isEarth = planet.id === 'earth' || (planet.name && planet.name.toLowerCase().includes('earth'))

  const tempC = tempK != null ? Math.round(tempK - 273.15) : null
  const gravity = mass && rad ? (mass / Math.pow(rad, 2)).toFixed(2) : null
  const gravityNum = gravity ? parseFloat(gravity) : null

  // Water regime analysis
  let waterRegime = 'Unmeasured'
  let waterDescription = 'Atmospheric pressure and surface volatile data remain unconfirmed.'
  if (tempK != null) {
    if (tempK < 273) {
      waterRegime = 'Cryogenic Solid Ice (<273 K)'
      waterDescription = `Equilibrium temperature sits at ${tempK} K (${tempC}°C). Surface water would freeze solid without sufficient geothermal heating or high atmospheric optical depth.`
    } else if (tempK <= 373) {
      waterRegime = 'Liquid Water Window (273–373 K)'
      waterDescription = `Equilibrium temperature sits at ${tempK} K (${tempC}°C), within the standard liquid water boundary at 1 atmosphere pressure.`
    } else {
      waterRegime = 'Superheated / Vaporized (>373 K)'
      waterDescription = `Equilibrium temperature reaches ${tempK} K (${tempC}°C), exceeding the vaporization threshold of water and inducing runaway greenhouse evaporation.`
    }
  }

  // Habitability assessment
  let habAssessment = ''
  if (hab.toLowerCase().includes('conservative')) {
    habAssessment = `Classified under the Conservative Habitable Zone. The planet receives between 90% and 115% of Earth's stellar flux, offering theoretical stability against runaway glaciation or greenhouse desiccation.`
  } else if (hab.toLowerCase().includes('optimistic')) {
    habAssessment = `Classified under the Optimistic Habitable Zone. Positioned near empirical Mars or Venus boundary analogs; atmospheric albedo and cloud feedback determine whether surface oceans can persist.`
  } else {
    habAssessment = `Classified as a Hostile Planetary Environment. Extreme equilibrium temperatures (${tempK != null ? `${tempK} K` : 'unmeasured'}) or close orbital proximity to the host star make Earth-like surface liquid water impossible.`
  }

  // Atmospheric retention
  let atmosphereNote = 'Spectroscopic characterization is pending observational transit analysis.'
  if (gravityNum != null) {
    if (gravityNum >= 0.8 && gravityNum <= 2.5) {
      atmosphereNote = `Surface gravity of ${gravity} g provides adequate escape velocity to retain nitrogen, oxygen, and carbon dioxide without generating crushing super-Jovian pressures.`
    } else if (gravityNum > 2.5) {
      atmosphereNote = `High surface gravity of ${gravity} g suggests dense volatiles or a thick gas envelope, with extreme atmospheric surface pressure.`
    } else {
      atmosphereNote = `Low surface gravity of ${gravity} g increases vulnerability to stellar wind stripping and flare-induced atmospheric erosion.`
    }
  }

  // Earth comparison ratios
  const earthRadiusRatio = rad ? (rad / 1.0).toFixed(2) : null
  const earthMassRatio = mass ? (mass / 1.0).toFixed(2) : null
  const earthPeriodRatio = period ? (period / 365.25).toFixed(2) : null

  return {
    name: planet.name,
    hostStar: planet.host_star || planet.star || 'Unknown',
    planetType: planet.planet_type || planet.type || 'Exoplanet',
    tempK,
    tempC,
    gravity,
    waterRegime,
    waterDescription,
    habAssessment,
    atmosphereNote,
    earthRadiusRatio,
    earthMassRatio,
    earthPeriodRatio,
    dist,
    period,
    isEarth,
    hab,
  }
}

/**
 * Generate statistical synthesis across a planetary dataset
 */
export function generateCatalogSynthesis(planets) {
  const count = planets.length
  if (count === 0) return null

  const habitableWorlds = planets.filter((p) => {
    const h = (p.habitability || '').toLowerCase()
    return h.includes('conservative') || h.includes('optimistic')
  })
  const conservativeCount = planets.filter((p) => (p.habitability || '').toLowerCase().includes('conservative')).length
  const optimisticCount = planets.filter((p) => (p.habitability || '').toLowerCase().includes('optimistic')).length
  const hostileCount = count - habitableWorlds.length

  const temps = planets.map((p) => getNum(p.equilibrium_temperature_k || p.temperature)).filter((t) => t != null)
  const avgTemp = temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null
  const minTemp = temps.length > 0 ? Math.min(...temps) : null
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null

  const radii = planets.map((p) => getNum(p.radius_earth || p.radius)).filter((r) => r != null)
  const avgRadius = radii.length > 0 ? (radii.reduce((a, b) => a + b, 0) / radii.length).toFixed(2) : null
  const minRadius = radii.length > 0 ? Math.min(...radii).toFixed(2) : null
  const maxRadius = radii.length > 0 ? Math.max(...radii).toFixed(2) : null

  const dists = planets.map((p) => getNum(p.distance_pc || p.distance)).filter((d) => d != null && d > 0)
  const closestDist = dists.length > 0 ? Math.min(...dists) : null
  const farthestDist = dists.length > 0 ? Math.max(...dists) : null

  return {
    count,
    habitableCount: habitableWorlds.length,
    conservativeCount,
    optimisticCount,
    hostileCount,
    avgTemp,
    minTemp,
    maxTemp,
    avgRadius,
    minRadius,
    maxRadius,
    closestDist,
    farthestDist,
  }
}

/**
 * 1. Export as PDF (AETHER Mission Dossier with Executive Summary)
 */
export function exportToPDF({ title, targetPlanets, sections = {}, timestamp }) {
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (!printWindow) {
    alert('Please allow popups to view and save the PDF report.')
    return
  }

  const catalogStats = targetPlanets.length > 1 ? generateCatalogSynthesis(targetPlanets) : null

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} — AETHER NASA Dossier</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a202c;
            background: #fff;
            margin: 0;
            padding: 24px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #2b6cb0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            color: #1a365d;
            letter-spacing: -0.02em;
          }
          .header .sub {
            font-size: 10px;
            color: #4a5568;
            font-family: monospace;
            margin-top: 2px;
          }
          .meta-pill {
            display: inline-block;
            background: #edf2f7;
            padding: 4px 9px;
            border-radius: 4px;
            font-size: 10px;
            font-family: monospace;
            color: #2d3748;
          }
          .executive-summary-card {
            background: #f7fafc;
            border: 1px solid #cbd5e0;
            border-left: 4px solid #2b6cb0;
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .executive-title {
            font-size: 12px;
            font-weight: 700;
            font-family: monospace;
            color: #2b6cb0;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .executive-body {
            font-size: 12px;
            color: #2d3748;
            line-height: 1.55;
          }
          .stat-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 10px;
          }
          .stat-pill {
            background: #edf2f7;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 10px;
          }
          .stat-pill label {
            display: block;
            color: #718096;
            font-size: 8px;
            font-family: monospace;
            text-transform: uppercase;
          }
          .stat-pill b {
            font-size: 12px;
            color: #1a202c;
          }
          .planet-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 18px;
            page-break-inside: avoid;
          }
          .planet-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .planet-title h2 {
            margin: 0;
            font-size: 18px;
            color: #2b6cb0;
          }
          .data-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 12px 0;
          }
          .data-box {
            background: #f7fafc;
            border: 1px solid #edf2f7;
            border-radius: 4px;
            padding: 8px;
          }
          .data-box label {
            display: block;
            font-size: 8px;
            font-family: monospace;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .data-box b {
            font-size: 13px;
            color: #2d3748;
          }
          .synthesis-box {
            background: #fffdf5;
            border: 1px solid #f6e05e;
            border-radius: 4px;
            padding: 10px 12px;
            margin: 10px 0;
            font-size: 11px;
            color: #744210;
            line-height: 1.5;
          }
          .synthesis-box b {
            color: #975a16;
          }
          .hab-box {
            margin-top: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            background: #ebf8ff;
            border: 1px solid #bee3f8;
            font-size: 11px;
            color: #2b6cb0;
          }
          .disclaimer {
            margin-top: 24px;
            padding: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background: #fffaf0;
            font-size: 9px;
            color: #744210;
          }
          .footer {
            margin-top: 20px;
            font-size: 9px;
            color: #a0aec0;
            font-family: monospace;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; background: #e2e8f0; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span><b>Print Preview</b> — Click the button to save as PDF or print.</span>
          <button onclick="window.print()" style="padding: 6px 14px; background: #2b6cb0; color: #fff; border: 0; border-radius: 4px; font-weight: bold; cursor: pointer;">
            Save as PDF / Print
          </button>
        </div>

        <div class="header">
          <div>
            <h1>AETHER · NASA MISSION DOSSIER</h1>
            <div class="sub">WHERE CURIOSITY MEETS THE COSMOS · ASTROPHYSICAL INTELLIGENCE DESK</div>
          </div>
          <div class="meta-pill">DATE: ${timestamp}</div>
        </div>

        ${sections.summary && catalogStats ? `
          <div class="executive-summary-card">
            <div class="executive-title">EXECUTIVE CATALOG SYNTHESIS (${catalogStats.count} WORLDS SURVEYED)</div>
            <div class="executive-body">
              This dossier analyzes ${catalogStats.count} confirmed exoplanetary systems cataloged by NASA space missions.
              Of the surveyed worlds, <b>${catalogStats.habitableCount}</b> reside within theoretical habitable boundaries
              (${catalogStats.conservativeCount} Conservative, ${catalogStats.optimisticCount} Optimistic), while
              <b>${catalogStats.hostileCount}</b> inhabit hostile regimes driven by extreme equilibrium temperatures or orbital proximity.
            </div>
            <div class="stat-summary-grid">
              <div class="stat-pill">
                <label>Avg Equilibrium Temp</label>
                <b>${catalogStats.avgTemp ? `${catalogStats.avgTemp} K` : 'N/A'}</b>
              </div>
              <div class="stat-pill">
                <label>Temp Range</label>
                <b>${catalogStats.minTemp ? `${catalogStats.minTemp}–${catalogStats.maxTemp} K` : 'N/A'}</b>
              </div>
              <div class="stat-pill">
                <label>Radius Range</label>
                <b>${catalogStats.minRadius ? `${catalogStats.minRadius}–${catalogStats.maxRadius} R⊕` : 'N/A'}</b>
              </div>
              <div class="stat-pill">
                <label>Closest System</label>
                <b>${catalogStats.closestDist ? `${catalogStats.closestDist} pc` : 'Sol System'}</b>
              </div>
            </div>
          </div>
        ` : ''}

        ${targetPlanets
          .map((p) => {
            const summary = generatePlanetSummary(p)
            const rad = p.radius_earth || p.radius
            const mass = p.mass_earth || p.mass
            const temp = p.equilibrium_temperature_k || p.temperature
            const dist = p.distance_pc || p.distance
            const period = p.orbital_period_days || p.period
            const hab = p.habitability || 'Hostile'

            return `
              <div class="planet-card">
                <div class="planet-title">
                  <h2>${p.name}</h2>
                  <span class="meta-pill">${summary.planetType} · Host: ${summary.hostStar}</span>
                </div>

                ${sections.summary ? `
                  <div class="synthesis-box">
                    <b>Astrobiological Assessment:</b> ${summary.habAssessment}<br/>
                    <b>Liquid Water Regime:</b> ${summary.waterRegime} — ${summary.waterDescription}<br/>
                    <b>Atmospheric Dynamics:</b> ${summary.atmosphereNote}
                  </div>
                ` : ''}

                ${sections.telemetry ? `
                  <div class="data-grid">
                    <div class="data-box">
                      <label>Radius (Earth Radii)</label>
                      <b>${fmt(rad, 'R⊕')}</b>
                    </div>
                    <div class="data-box">
                      <label>Mass (Earth Masses)</label>
                      <b>${fmt(mass, 'M⊕')}</b>
                    </div>
                    <div class="data-box">
                      <label>Distance</label>
                      <b>${fmt(dist, 'pc')}</b>
                    </div>
                    <div class="data-box">
                      <label>Equilibrium Temp</label>
                      <b>${fmt(temp, 'K')} ${summary.tempC != null ? `(${summary.tempC}°C)` : ''}</b>
                    </div>
                    <div class="data-box">
                      <label>Orbital Period</label>
                      <b>${fmt(period, 'days')}</b>
                    </div>
                    <div class="data-box">
                      <label>Discovery Year</label>
                      <b>${fmt(p.discovery_year)}</b>
                    </div>
                  </div>
                ` : ''}

                ${sections.habitability ? `
                  <div class="hab-box">
                    <b>Zone Classification:</b> ${hab} Habitable Zone<br/>
                    <small>Calculated based on Kopparapu et al. stellar flux limits and runaway greenhouse models.</small>
                  </div>
                ` : ''}

                ${sections.benchmark ? `
                  <div style="margin-top: 10px; font-size: 11px; color: #4a5568;">
                    <b>Earth Comparative Ratios:</b>
                    Radius: ${summary.earthRadiusRatio ? `${summary.earthRadiusRatio}x Earth` : 'Unmeasured'} |
                    Mass: ${summary.earthMassRatio ? `${summary.earthMassRatio}x Earth` : 'Unmeasured'} |
                    Surface Gravity: ${summary.gravity ? `${summary.gravity} g` : 'Spectroscopy pending'} |
                    Year Cycle: ${summary.earthPeriodRatio ? `${summary.earthPeriodRatio}x Earth Year` : 'Unmeasured'}
                  </div>
                ` : ''}
              </div>
            `
          })
          .join('')}

        ${sections.notice ? `
          <div class="disclaimer">
            <b>MANDATORY SCIENTIFIC NOTICE:</b> Habitability indicators describe theoretical orbital mechanics
            where liquid water could potentially persist. They do not constitute proof of surface water,
            atmosphere, or biological activity. Data verified against the NASA Exoplanet Archive.
          </div>
        ` : ''}

        <div class="footer">
          <span>AETHER ASTROPHYSICAL RESEARCH DESK</span>
          <span>NASA EXOPLANET ARCHIVE TAP INTEGRATION</span>
        </div>

        <script>
          // Auto-trigger print dialog after layout render
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * 2. Export as DOCX (Formatted Microsoft Word document with Executive Summary)
 */
export function exportToDOCX({ title, targetPlanets, sections = {}, timestamp }) {
  const catalogStats = targetPlanets.length > 1 ? generateCatalogSynthesis(targetPlanets) : null

  const summariesHtml = targetPlanets
    .map((p) => {
      const summary = generatePlanetSummary(p)
      return `
        <div style="margin-bottom: 12pt; padding: 8pt; background-color: #f7f9fa; border-left: 3pt solid #003366;">
          <h3 style="margin: 0 0 4pt; color: #003366; font-size: 12pt;">${p.name} — Synthesis</h3>
          <p style="margin: 2pt 0; font-size: 9.5pt;"><b>Astrobiological Assessment:</b> ${summary.habAssessment}</p>
          <p style="margin: 2pt 0; font-size: 9.5pt;"><b>Water Regime:</b> ${summary.waterRegime} (${summary.waterDescription})</p>
          <p style="margin: 2pt 0; font-size: 9.5pt;"><b>Atmosphere Dynamics:</b> ${summary.atmosphereNote}</p>
          <p style="margin: 2pt 0; font-size: 9.5pt;"><b>Earth Comparison:</b> Radius: ${summary.earthRadiusRatio || 'N/A'}x | Mass: ${summary.earthMassRatio || 'N/A'}x | Gravity: ${summary.gravity ? `${summary.gravity} g` : 'N/A'}</p>
        </div>
      `
    })
    .join('')

  const tableRows = targetPlanets
    .map((p) => {
      const rad = p.radius_earth || p.radius
      const mass = p.mass_earth || p.mass
      const temp = p.equilibrium_temperature_k || p.temperature
      const dist = p.distance_pc || p.distance
      const period = p.orbital_period_days || p.period
      const gravity = mass && rad ? (mass / Math.pow(rad, 2)).toFixed(2) : 'Unmeasured'

      return `
        <tr>
          <td><b>${p.name}</b></td>
          <td>${p.host_star || p.star || 'N/A'}</td>
          <td>${fmt(rad, 'R⊕')}</td>
          <td>${fmt(mass, 'M⊕')}</td>
          <td>${fmt(temp, 'K')}</td>
          <td>${fmt(period, 'days')}</td>
          <td>${fmt(dist, 'pc')}</td>
          <td>${gravity !== 'Unmeasured' ? `${gravity} g` : 'N/A'}</td>
          <td>${p.habitability || 'Hostile'}</td>
        </tr>
      `
    })
    .join('')

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222; }
          h1 { color: #003366; font-size: 18pt; border-bottom: 2pt solid #003366; margin-bottom: 4pt; }
          .sub { color: #666; font-size: 9pt; margin-bottom: 16pt; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 12pt; margin-bottom: 16pt; }
          th, td { border: 1pt solid #aaa; padding: 5pt 7pt; font-size: 9.5pt; text-align: left; }
          th { background-color: #e8eef4; color: #003366; font-weight: bold; }
          .executive { background: #f0f4f8; border: 1pt solid #cbd5e0; padding: 10pt; margin-bottom: 14pt; }
          .notice { background: #fdf8e2; border: 1pt solid #e6dcaf; padding: 8pt; font-size: 9pt; color: #665200; margin-top: 16pt; }
          .footer { font-size: 8pt; color: #888; margin-top: 20pt; border-top: 1pt solid #ddd; padding-top: 5pt; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="sub">AETHER SCIENTIFIC INTELLIGENCE DOSSIER · COMPILED: ${timestamp}</div>

        ${sections.summary && catalogStats ? `
          <div class="executive">
            <h2 style="font-size: 13pt; color: #003366; margin-top: 0;">Executive Catalog Synthesis</h2>
            <p>This dossier contains analysis of <b>${catalogStats.count}</b> exoplanetary bodies from the NASA Exoplanet Archive.
            Of these, <b>${catalogStats.habitableCount}</b> meet stellar flux criteria for potential liquid water retention (${catalogStats.conservativeCount} Conservative, ${catalogStats.optimisticCount} Optimistic), while <b>${catalogStats.hostileCount}</b> inhabit hostile environments.</p>
            <p><b>Average Equilibrium Temperature:</b> ${catalogStats.avgTemp ? `${catalogStats.avgTemp} K` : 'N/A'} (Range: ${catalogStats.minTemp}–${catalogStats.maxTemp} K) | <b>Radius Range:</b> ${catalogStats.minRadius}–${catalogStats.maxRadius} R⊕</p>
          </div>
        ` : ''}

        ${sections.summary ? `
          <h2>Astrobiological Synthesis & Environmental Assessment</h2>
          ${summariesHtml}
        ` : ''}

        ${sections.telemetry ? `
          <h2>Planetary Observation Telemetry</h2>
          <table>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Host Star</th>
                <th>Radius</th>
                <th>Mass</th>
                <th>Equil. Temp</th>
                <th>Period</th>
                <th>Distance</th>
                <th>Gravity</th>
                <th>Habitability</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        ` : ''}

        ${sections.notice ? `
          <div class="notice">
            <b>SCIENTIFIC NOTICE:</b> Habitability indicators describe theoretical orbital mechanics
            where liquid water could potentially persist. They do not constitute proof of surface water,
            atmosphere, or biological activity. Data verified against the NASA Exoplanet Archive.
          </div>
        ` : ''}

        <div class="footer">
          Source: NASA Exoplanet Archive TAP API & Planetary Habitability Laboratory (PHL). Generated via AETHER.
        </div>
      </body>
    </html>
  `

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword',
  })
  triggerDownload(blob, `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.doc`)
}

/**
 * 3. Export as ZIP (Complete Data Bundle: JSON + CSV + Markdown + Citations)
 */
export async function exportToZIP({ title, targetPlanets, sections = {}, timestamp }) {
  const zip = new JSZip()
  const catalogStats = generateCatalogSynthesis(targetPlanets)
  const planetSummaries = targetPlanets.map((p) => generatePlanetSummary(p))

  // 1. JSON Data with Full Synthesis
  zip.file(
    'telemetry_data.json',
    JSON.stringify(
      {
        title,
        timestamp,
        source: 'NASA Exoplanet Archive',
        platform: 'AETHER — Where Curiosity Meets the Cosmos',
        planets_count: targetPlanets.length,
        statistics: catalogStats,
        summaries: planetSummaries,
        data: targetPlanets,
      },
      null,
      2
    )
  )

  // 2. CSV Spreadsheet
  const csvHeaders = 'Name,Host_Star,Planet_Type,Radius_Earth,Mass_Earth,Equilibrium_Temp_K,Orbital_Period_Days,Distance_PC,Discovery_Year,Habitability\n'
  const csvRows = targetPlanets
    .map((p) => {
      const name = `"${p.name || ''}"`
      const star = `"${p.host_star || p.star || ''}"`
      const type = `"${p.planet_type || p.type || ''}"`
      const rad = p.radius_earth || p.radius || ''
      const mass = p.mass_earth || p.mass || ''
      const temp = p.equilibrium_temperature_k || p.temperature || ''
      const period = p.orbital_period_days || p.period || ''
      const dist = p.distance_pc || p.distance || ''
      const year = p.discovery_year || ''
      const hab = `"${p.habitability || 'Hostile'}"`
      return [name, star, type, rad, mass, temp, period, dist, year, hab].join(',')
    })
    .join('\n')
  zip.file('planetary_dataset.csv', csvHeaders + csvRows)

  // 3. Dedicated Executive Summary Markdown
  const execSummaryMd = `
# ${title} — Executive Scientific Summary
**Platform:** AETHER (Where Curiosity Meets the Cosmos)  
**Date of Compilation:** ${timestamp}  
**Data Accreditation:** NASA Exoplanet Archive & Planetary Habitability Laboratory  

---

## 1. Catalog Synthesis Overview
- **Surveyed Planetary Bodies:** ${catalogStats.count}
- **Habitable Zone Candidates:** ${catalogStats.habitableCount} (${catalogStats.conservativeCount} Conservative, ${catalogStats.optimisticCount} Optimistic)
- **Hostile Planetary Regimes:** ${catalogStats.hostileCount}
- **Average Equilibrium Temperature:** ${catalogStats.avgTemp ? `${catalogStats.avgTemp} K (${catalogStats.avgTemp - 273}°C)` : 'Unmeasured'}
- **Observed Temperature Range:** ${catalogStats.minTemp ? `${catalogStats.minTemp} K to ${catalogStats.maxTemp} K` : 'N/A'}
- **Radius Spectrum:** ${catalogStats.minRadius ? `${catalogStats.minRadius} R⊕ to ${catalogStats.maxRadius} R⊕` : 'N/A'}

### Observational Bias Note
NASA Kepler and TESS transit search methodologies inherently favor worlds with short orbital periods (1–10 days) and high transit frequencies, causing heavy observational skew toward hot, hostile Jovians and super-Earths over long-period (300+ day) temperate Earth analogs.

---

## 2. In-Depth Planetary Findings

${planetSummaries
  .map(
    (s) => `
### ${s.name}
- **Classification:** ${s.planetType} (Host Star: ${s.hostStar})
- **Habitability Status:** ${s.hab}
- **Equilibrium Temperature:** ${s.tempK ? `${s.tempK} K (${s.tempC}°C)` : 'Unmeasured'}
- **Liquid Water Regime:** ${s.waterRegime}
- **Atmospheric Retention Profile:** ${s.atmosphereNote}
- **Earth Proportions:** Radius: ${s.earthRadiusRatio ? `${s.earthRadiusRatio}x Earth` : 'N/A'} | Mass: ${s.earthMassRatio ? `${s.earthMassRatio}x Earth` : 'N/A'} | Gravity: ${s.gravity ? `${s.gravity} g` : 'N/A'}
- **Astrobiological Assessment:** ${s.habAssessment}
`
  )
  .join('\n')}

---
*Generated by AETHER — AI-Powered 3D Exoplanet Explorer.*
`
  zip.file('EXECUTIVE_SUMMARY.md', execSummaryMd.trim())

  // 4. Markdown Field Report
  const mdContent = `
# ${title} — Field Observation Report
**Compiled:** ${timestamp}  
**Source:** NASA Exoplanet Archive (TAP Integration) via AETHER  

## Target Worlds Summary (${targetPlanets.length} Total)

${targetPlanets
  .map(
    (p) => `
### ${p.name}
- **Host Star:** ${p.host_star || p.star || 'Unknown'}
- **Classification:** ${p.planet_type || p.type || 'Exoplanet'}
- **Radius:** ${fmt(p.radius_earth || p.radius, 'R⊕')}
- **Mass:** ${fmt(p.mass_earth || p.mass, 'M⊕')}
- **Equilibrium Temperature:** ${fmt(p.equilibrium_temperature_k || p.temperature, 'K')}
- **Orbital Period:** ${fmt(p.orbital_period_days || p.period, 'days')}
- **Distance:** ${fmt(p.distance_pc || p.distance, 'pc')}
- **Habitability Status:** ${p.habitability || 'Hostile'}
`
  )
  .join('\n')}

---
*Generated by AETHER — An AI-Powered 3D Exoplanet Explorer.*
`
  zip.file('FIELD_REPORT.md', mdContent.trim())

  // 5. Citation & README
  zip.file(
    'NASA_CITATION.txt',
    `AETHER RESEARCH DOSSIER BUNDLE
==============================
Platform: AETHER — Where Curiosity Meets the Cosmos
Date: ${timestamp}
Archive: NASA Exoplanet Archive (NASA / Caltech IPAC)
Standard Units: Earth Radii (R_earth), Earth Masses (M_earth), Kelvin (K), Parsecs (pc)

Habitability indicators are derived from Kopparapu et al. (2013, 2014) stellar flux boundaries.
No extraterrestrial life is established by these indicators.`
  )

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(zipBlob, `${title.toLowerCase().replace(/\s+/g, '_')}_bundle_${Date.now()}.zip`)
}
