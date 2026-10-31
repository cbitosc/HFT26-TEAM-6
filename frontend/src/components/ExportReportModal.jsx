import { useState, useId } from 'react'
import {
  Download,
  FileText,
  FileCode,
  Archive,
  Check,
  X,
  Layers,
  Globe2,
  Sparkles,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { exportToPDF, exportToDOCX, exportToZIP } from '../utils/exportReport'
import { EARTH_BENCHMARK, INITIAL_PLANETS } from '../services/api'

export default function ExportReportModal({
  isOpen,
  onClose,
  selectedPlanet,
  worlds = [],
}) {
  const [format, setFormat] = useState('pdf') // 'pdf' | 'docx' | 'zip'
  const [scope, setScope] = useState('active') // 'active' | 'compare' | 'habitable' | 'all'
  const [sections, setSections] = useState({
    telemetry: true,
    habitability: true,
    benchmark: true,
    notice: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  if (!isOpen) return null

  const activePlanet = selectedPlanet || worlds[0] || INITIAL_PLANETS[0]

  // Determine target worlds based on selected scope
  const getTargetPlanets = () => {
    switch (scope) {
      case 'active':
        return [activePlanet]
      case 'compare':
        return [activePlanet, EARTH_BENCHMARK]
      case 'habitable': {
        const pool = worlds.length > 0 ? worlds : INITIAL_PLANETS
        const filtered = pool.filter((w) => {
          const h = (w.habitability || '').toLowerCase()
          return h.includes('conservative') || h.includes('optimistic')
        })
        // If loaded pool happens to have 0 habitable worlds, fall back to known benchmark candidates
        if (filtered.length === 0) {
          return INITIAL_PLANETS.filter((w) => {
            const h = (w.habitability || '').toLowerCase()
            return h.includes('conservative') || h.includes('optimistic')
          })
        }
        return filtered
      }
      case 'all':
      default:
        return worlds.length > 0 ? worlds : INITIAL_PLANETS
    }
  }

  const targetPlanets = getTargetPlanets()

  const handleToggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    let title = 'ExoVerse Planetary Dossier'
    if (scope === 'active') {
      title = `ExoVerse Dossier · ${activePlanet.name}`
    } else if (scope === 'compare') {
      title = `Comparative Analysis · ${activePlanet.name} vs Earth`
    } else if (scope === 'habitable') {
      title = `ExoVerse Habitable Zone Candidates (${targetPlanets.length} Worlds)`
    } else if (scope === 'all') {
      title = `ExoVerse Complete Exoplanet Catalogue (${targetPlanets.length} Worlds)`
    }

    try {
      if (format === 'pdf') {
        exportToPDF({
          title,
          targetPlanets,
          sections,
          timestamp: dateStr,
        })
      } else if (format === 'docx') {
        exportToDOCX({
          title,
          targetPlanets,
          sections,
          timestamp: dateStr,
        })
      } else if (format === 'zip') {
        await exportToZIP({
          title,
          targetPlanets,
          sections,
          timestamp: dateStr,
        })
      }

      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Encountered an issue generating report: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="export-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="export-modal-header">
          <div>
            <div className="export-modal-eyebrow">
              <Sparkles size={13} />
              <span>CUSTOM REPORT BUILDER</span>
            </div>
            <h3>Mission Dossier & Intelligence Export</h3>
            <p>Generate academic-grade planetary reports, datasets, and telemetry dossiers.</p>
          </div>
          <button className="export-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="export-modal-body">
          {/* 1. Scope Selection */}
          <div className="export-section">
            <label className="export-section-title">
              <span className="export-step-badge">1</span>
              <span>Select Planetary Scope</span>
            </label>
            <div className="export-scope-grid">
              <button
                type="button"
                className={`export-scope-card ${scope === 'active' ? 'active' : ''}`}
                onClick={() => setScope('active')}
              >
                <div className="scope-radio">
                  {scope === 'active' && <div className="scope-radio-fill" />}
                </div>
                <div className="scope-info">
                  <b>Current World ({activePlanet.name})</b>
                  <small>Detailed single-planet inspection report</small>
                </div>
              </button>

              <button
                type="button"
                className={`export-scope-card ${scope === 'compare' ? 'active' : ''}`}
                onClick={() => setScope('compare')}
              >
                <div className="scope-radio">
                  {scope === 'compare' && <div className="scope-radio-fill" />}
                </div>
                <div className="scope-info">
                  <b>Comparison Pair ({activePlanet.name} vs Earth)</b>
                  <small>Proportional physical & habitability differential</small>
                </div>
              </button>

              <button
                type="button"
                className={`export-scope-card ${scope === 'habitable' ? 'active' : ''}`}
                onClick={() => setScope('habitable')}
              >
                <div className="scope-radio">
                  {scope === 'habitable' && <div className="scope-radio-fill" />}
                </div>
                <div className="scope-info">
                  <b>Habitable Zone Candidates</b>
                  <small>Conservative & optimistic Goldilocks worlds only</small>
                </div>
              </button>

              <button
                type="button"
                className={`export-scope-card ${scope === 'all' ? 'active' : ''}`}
                onClick={() => setScope('all')}
              >
                <div className="scope-radio">
                  {scope === 'all' && <div className="scope-radio-fill" />}
                </div>
                <div className="scope-info">
                  <b>Complete Loaded Catalog ({worlds.length} Worlds)</b>
                  <small>All confirmed planetary systems in active memory</small>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Custom Sections */}
          <div className="export-section">
            <label className="export-section-title">
              <span className="export-step-badge">2</span>
              <span>Included Intelligence Sections</span>
            </label>
            <div className="export-checkbox-grid">
              <label className="export-check-item">
                <input
                  type="checkbox"
                  checked={sections.telemetry}
                  onChange={() => handleToggleSection('telemetry')}
                />
                <span className="custom-check-box">
                  {sections.telemetry && <Check size={12} />}
                </span>
                <span className="check-text">
                  <b>NASA Observational Telemetry</b>
                  <small>Radius (R⊕), Mass (M⊕), Distance (pc), Period, Equilibrium Temp (K)</small>
                </span>
              </label>

              <label className="export-check-item">
                <input
                  type="checkbox"
                  checked={sections.habitability}
                  onChange={() => handleToggleSection('habitability')}
                />
                <span className="custom-check-box">
                  {sections.habitability && <Check size={12} />}
                </span>
                <span className="check-text">
                  <b>Habitability & Thermal Model</b>
                  <small>Kopparapu stellar flux zones, runaway greenhouse boundaries</small>
                </span>
              </label>

              <label className="export-check-item">
                <input
                  type="checkbox"
                  checked={sections.benchmark}
                  onChange={() => handleToggleSection('benchmark')}
                />
                <span className="custom-check-box">
                  {sections.benchmark && <Check size={12} />}
                </span>
                <span className="check-text">
                  <b>Earth Comparative Ratios</b>
                  <small>Physical proportions, surface gravity (g = M/R²), year cycle</small>
                </span>
              </label>

              <label className="export-check-item">
                <input
                  type="checkbox"
                  checked={sections.notice}
                  onChange={() => handleToggleSection('notice')}
                />
                <span className="custom-check-box">
                  {sections.notice && <Check size={12} />}
                </span>
                <span className="check-text">
                  <b>Scientific Notice & NASA Archive Citation</b>
                  <small>Mandatory biological disclaimer & astronomical data accreditation</small>
                </span>
              </label>
            </div>
          </div>

          {/* 3. Export Format */}
          <div className="export-section">
            <label className="export-section-title">
              <span className="export-step-badge">3</span>
              <span>Export Format</span>
            </label>
            <div className="export-format-grid">
              <button
                type="button"
                className={`export-format-card ${format === 'pdf' ? 'active' : ''}`}
                onClick={() => setFormat('pdf')}
              >
                <div className="format-icon pdf-icon">
                  <FileText size={22} />
                </div>
                <div className="format-info">
                  <b>PDF Dossier</b>
                  <span>NASA Mission briefing with print styling</span>
                </div>
                <span className="format-tag">.pdf</span>
              </button>

              <button
                type="button"
                className={`export-format-card ${format === 'docx' ? 'active' : ''}`}
                onClick={() => setFormat('docx')}
              >
                <div className="format-icon docx-icon">
                  <FileCode size={22} />
                </div>
                <div className="format-info">
                  <b>Word Document</b>
                  <span>Structured tables compatible with MS Word & Docs</span>
                </div>
                <span className="format-tag">.doc</span>
              </button>

              <button
                type="button"
                className={`export-format-card ${format === 'zip' ? 'active' : ''}`}
                onClick={() => setFormat('zip')}
              >
                <div className="format-icon zip-icon">
                  <Archive size={22} />
                </div>
                <div className="format-info">
                  <b>Research ZIP Bundle</b>
                  <span>JSON telemetry + CSV dataset + Markdown + Citations</span>
                </div>
                <span className="format-tag">.zip</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="export-modal-footer">
          <div className="export-summary-stat">
            <b>{targetPlanets.length} World{targetPlanets.length === 1 ? '' : 's'} Selected</b>
            <span>Format: {format.toUpperCase()} · Ready for export</span>
          </div>

          <div className="export-footer-actions">
            <button
              type="button"
              className="export-cancel-btn"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>

            <button
              type="button"
              className={`export-submit-btn ${exportSuccess ? 'success' : ''}`}
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Compiling Dossier...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download {format.toUpperCase()} Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
