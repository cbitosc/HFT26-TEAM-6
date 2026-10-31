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

/**
 * 1. Export as PDF (opens clean print-formatted NASA Mission Dossier)
 */
export function exportToPDF({ title, targetPlanets, sections, timestamp }) {
  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (!printWindow) {
    alert('Please allow popups to view and save the PDF report.')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} — ExoVerse NASA Dossier</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a202c;
            background: #fff;
            margin: 0;
            padding: 24px;
            line-height: 1.45;
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
            font-size: 11px;
            color: #4a5568;
            font-family: monospace;
          }
          .meta-pill {
            display: inline-block;
            background: #edf2f7;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-family: monospace;
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
            font-size: 14px;
            color: #2d3748;
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
            <h1>EXOVERSE · NASA MISSION DOSSIER</h1>
            <div class="sub">ASTROPHYSICAL TELEMETRY & HABITABILITY RESEARCH REPORT</div>
          </div>
          <div class="meta-pill">DATE: ${timestamp}</div>
        </div>

        ${targetPlanets
          .map((p) => {
            const rad = p.radius_earth || p.radius
            const mass = p.mass_earth || p.mass
            const temp = p.equilibrium_temperature_k || p.temperature
            const dist = p.distance_pc || p.distance
            const period = p.orbital_period_days || p.period
            const gravity = mass && rad ? (mass / Math.pow(rad, 2)).toFixed(2) : null
            const hab = p.habitability || 'Hostile'

            return `
              <div class="planet-card">
                <div class="planet-title">
                  <h2>${p.name}</h2>
                  <span class="meta-pill">${p.planet_type || p.type || 'Exoplanet'} · Host: ${p.host_star || p.star || 'Unknown'}</span>
                </div>

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
                      <b>${fmt(temp, 'K')}</b>
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
                    <small>Evaluation based on stellar flux and atmospheric runaway greenhouse boundaries.</small>
                  </div>
                ` : ''}

                ${sections.benchmark ? `
                  <div style="margin-top: 10px; font-size: 11px; color: #4a5568;">
                    <b>Earth Ratios:</b>
                    Radius: ${rad ? `${(rad / 1.0).toFixed(2)}x Earth` : 'Unmeasured'} |
                    Mass: ${mass ? `${(mass / 1.0).toFixed(2)}x Earth` : 'Unmeasured'} |
                    Surface Gravity: ${gravity ? `${gravity} g` : 'Pending spectroscopy'}
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
          <span>EXOVERSE ASTROPHYSICAL RESEARCH DESK</span>
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
 * 2. Export as DOCX (Formatted Microsoft Word document)
 */
export function exportToDOCX({ title, targetPlanets, sections, timestamp }) {
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
          .notice { background: #fdf8e2; border: 1pt solid #e6dcaf; padding: 8pt; font-size: 9pt; color: #665200; margin-top: 16pt; }
          .footer { font-size: 8pt; color: #888; margin-top: 20pt; border-top: 1pt solid #ddd; padding-top: 5pt; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="sub">EXOVERSE SCIENTIFIC INTELLIGENCE DOSSIER · COMPILED: ${timestamp}</div>

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

        ${sections.notice ? `
          <div class="notice">
            <b>SCIENTIFIC NOTICE:</b> Habitability indicators describe theoretical orbital mechanics
            where liquid water could potentially persist. They do not constitute proof of surface water,
            atmosphere, or biological activity. Data verified against the NASA Exoplanet Archive.
          </div>
        ` : ''}

        <div class="footer">
          Source: NASA Exoplanet Archive TAP API & Planetary Habitability Laboratory (PHL). Generated via ExoVerse.
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
export async function exportToZIP({ title, targetPlanets, sections, timestamp }) {
  const zip = new JSZip()

  // 1. JSON Data
  zip.file(
    'telemetry_data.json',
    JSON.stringify(
      {
        title,
        timestamp,
        source: 'NASA Exoplanet Archive',
        planets_count: targetPlanets.length,
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

  // 3. Markdown Field Report
  const mdContent = `
# ${title}
**Compiled:** ${timestamp}  
**Source:** NASA Exoplanet Archive (TAP Integration)

## Summary of Target Worlds (${targetPlanets.length} Total)

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
*Generated by ExoVerse — An AI-Powered 3D Exoplanet Explorer.*
`
  zip.file('FIELD_REPORT.md', mdContent.trim())

  // 4. Citation & README
  zip.file(
    'NASA_CITATION.txt',
    `EXOVERSE RESEARCH BUNDLE
========================
Date: ${timestamp}
Archive: NASA Exoplanet Archive (NASA / Caltech IPAC)
Standard Units: Earth Radii (R_earth), Earth Masses (M_earth), Kelvin (K), Parsecs (pc)

Habitability indicators are derived from Kopparapu et al. (2013, 2014) stellar flux boundaries.
No extraterrestrial life is established by these indicators.`
  )

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(zipBlob, `${title.toLowerCase().replace(/\s+/g, '_')}_bundle_${Date.now()}.zip`)
}
