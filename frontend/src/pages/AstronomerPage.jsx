import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight, Bot, Compass, Globe2, HelpCircle, Loader2,
  Orbit, RefreshCw, Send, Sparkles, Trash2, User, Zap
} from 'lucide-react'
import { chatWithAstronomer, EARTH_BENCHMARK } from '../services/api'

// Pre-crafted dynamic suggestions per planet archetype (Task #8)
const PLANET_PROMPTS = {
  'kepler-186-f': [
    'Could Kepler-186f maintain liquid surface water?',
    'How does Kepler-186f’s red dwarf star affect surface illumination?',
    'What atmospheric composition would keep Kepler-186f from freezing?',
  ],
  'trappist-1-e': [
    'Is TRAPPIST-1e tidally locked to its host star?',
    'How does TRAPPIST-1e compare to Earth in size and radiation?',
    'Could TRAPPIST-1e retain an atmosphere despite stellar flares?',
  ],
  '55-cancri-e': [
    'What causes magma oceans on 55 Cancri e?',
    'Why is 55 Cancri e’s orbital year shorter than 18 hours?',
    'Could 55 Cancri e have a mineral-rich supercritical atmosphere?',
  ],
  'wasp-12-b': [
    'Why is WASP-12b being distorted into an egg shape?',
    'How fast is WASP-12b losing mass to its host star?',
    'What makes hot Jupiters like WASP-12b so extremely dark?',
  ],
  'gliese-436-b': [
    'What is exotic high-pressure ice (Ice X) inside Gliese 436 b?',
    'Explain the massive evaporating hydrogen tail of Gliese 436 b.',
    'Could Gliese 436 b have any rocky moons?',
  ],
  'proxima-centauri-b': [
    'How do Proxima Centauri’s superflares affect habitability?',
    'What is the travel time to Proxima Centauri b with current tech?',
    'Is Proxima Centauri b likely in a 3:2 spin-orbit resonance?',
  ],
  'toi-700-d': [
    'Why is TOI-700 considered a quiet M-dwarf star?',
    'Does TOI-700 d experience extreme seasonal variations?',
    'How does NASA TESS confirm worlds like TOI-700 d?',
  ],
  'kepler-452-b': [
    'Why is Kepler-452 b called Earth’s older cousin?',
    'Why is the exact mass of Kepler-452 b still unmeasured?',
    'How does a G2-type host star influence its habitable zone?',
  ],
  'earth': [
    'How does Earth serve as the baseline for all habitability models?',
    'What atmospheric biosignatures would an alien observer detect on Earth?',
    'Why is Earth’s magnetic field essential for atmospheric retention?',
  ],
  'general': [
    'How do astronomers determine exoplanet temperatures from light years away?',
    'What is the difference between Conservative and Optimistic habitable zones?',
    'Why doesn’t finding an Earth-size planet prove the existence of life?',
  ],
}

export default function AstronomerPage({
  worlds = [],
  selectedPlanet = null,
  initialCompare = null,
  onNavigate,
}) {
  const allPlanets = useMemo(() => {
    return [EARTH_BENCHMARK, ...worlds.filter((w) => w.id !== 'earth')]
  }, [worlds])

  const [activePlanetId, setActivePlanetId] = useState(
    selectedPlanet?.id || (worlds[0]?.id || 'kepler-186-f')
  )
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Greetings, Observer. I am the **AETHER AI Astronomer**, connected to observational data from NASA's Exoplanet Archive.\n\nI can analyze atmospheric retention, tidal locking dynamics, orbital mechanics, and habitability constraints for any known exoplanet.\n\n*Rule of Observation: Habitability indicators describe physical orbital conditions, not biological proof of life.*`,
      timestamp: 'Just now',
    },
  ])

  const activePlanet = useMemo(() => {
    if (activePlanetId === 'general') return null
    return allPlanets.find((p) => p.id === activePlanetId) || allPlanets[0]
  }, [allPlanets, activePlanetId])

  // Dynamic suggested prompts for the active planet (Task #8)
  const currentSuggestions = useMemo(() => {
    const key = activePlanet?.id || 'general'
    return PLANET_PROMPTS[key] || PLANET_PROMPTS['general']
  }, [activePlanet])

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Handle comparison prompt if passed from Compare page
  useEffect(() => {
    if (initialCompare?.planetA && initialCompare?.planetB) {
      const pA = initialCompare.planetA
      const pB = initialCompare.planetB
      const promptText = `Compare the physical properties, temperature, and habitability potential of ${pA.name} and ${pB.name}.`
      sendMessage(promptText, pA)
    }
  }, [initialCompare])

  // Send message handler
  async function sendMessage(textToSend, planetContext = activePlanet) {
    const cleanText = (textToSend || inputMessage).trim()
    if (!cleanText || isLoading) return

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      planetContext: planetContext?.name || 'General Astronomy',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const historyContext = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const answer = await chatWithAstronomer(cleanText, planetContext, historyContext)

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: 'Unable to reach the astronomical data service. Please verify your connection or retry in a moment.',
          timestamp: 'Error',
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Observational desk reset. How may I assist your astrophysical research today?',
        timestamp: 'Just now',
      },
    ])
  }

  // Format markdown helper (bold, headers, bullets)
  const renderFormattedText = (raw) => {
    if (!raw) return ''
    const lines = raw.split('\n')
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return <h4 key={`h3-${idx}`} className="chat-h3">{line.replace('### ', '')}</h4>
      }
      // Header 2
      if (line.startsWith('## ')) {
        return <h3 key={`h2-${idx}`} className="chat-h2">{line.replace('## ', '')}</h3>
      }
      // Bullet list
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2)
        return (
          <li key={`li-${idx}`} className="chat-bullet">
            {formatInlineText(content)}
          </li>
        )
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={`num-${idx}`} className="chat-num-item">
            {formatInlineText(line)}
          </div>
        )
      }
      // Paragraph
      return (
        <p key={`p-${idx}`} className="chat-p">
          {formatInlineText(line)}
        </p>
      )
    })
  }

  // Bold & Italic parser
  const formatInlineText = (text) => {
    if (!text) return ''
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>
      }
      return part
    })
  }

  return (
    <div className="content-wrap astronomer-page">
      {/* Page Header */}
      <section className="page-heading astronomer-heading">
        <div>
          <div className="eyebrow">
            ASTROPHYSICAL INTELLIGENCE <span>—</span> FEATHERLESS INTEGRATION
          </div>
          <h1>AETHER AI <em>Astronomer.</em></h1>
          <p>
            Engage in rigorous scientific discourse grounded in NASA Exoplanet Archive measurements.
          </p>
        </div>

        <div className="heading-index">
          <span>MODEL DESK</span>
          <b>QWEN</b>
          <small>Qwen-2.5-7B Online</small>
        </div>
      </section>

      {/* Main Chat Layout (Study Context Sidebar + Chat Window) */}
      <div className="astronomer-layout">
        {/* Left Column: Active Study Context & Quick Prompts */}
        <aside className="study-context-pane">
          <div className="pane-header">
            <span className="pane-tag">STUDY SUBJECT CONTEXT</span>
            <label htmlFor="planet-context-select" className="sr-only">Study Subject Context</label>
            <select
              id="planet-context-select"
              value={activePlanetId}
              onChange={(e) => setActivePlanetId(e.target.value)}
              className="planet-context-dropdown"
            >
              <option value="general">✦ General Astronomy (Broad Field)</option>
              {allPlanets.map((p) => (
                <option key={`opt-${p.id}`} value={p.id}>
                  {p.name} ({p.host_star})
                </option>
              ))}
            </select>
          </div>

          {activePlanet ? (
            <div className="active-planet-card" style={{ '--accent-color': activePlanet.color }}>
              <div className="active-planet-top">
                <span className="planet-dot" style={{ backgroundColor: activePlanet.color }} />
                <div>
                  <h3>{activePlanet.name}</h3>
                  <small>Orbiting {activePlanet.host_star}</small>
                </div>
              </div>

              <div className="active-mini-metrics">
                <div>
                  <span>RADIUS</span>
                  <b>{activePlanet.radius_earth ? `${activePlanet.radius_earth} R⊕` : 'Unmeasured'}</b>
                </div>
                <div>
                  <span>MASS</span>
                  <b>{activePlanet.mass_earth ? `${activePlanet.mass_earth} M⊕` : 'Unmeasured'}</b>
                </div>
                <div>
                  <span>TEMPERATURE</span>
                  <b>{activePlanet.equilibrium_temperature_k ? `${activePlanet.equilibrium_temperature_k} K` : 'Unmeasured'}</b>
                </div>
                <div>
                  <span>ORBIT</span>
                  <b>{activePlanet.orbital_period_days ? `${activePlanet.orbital_period_days} d` : 'Unmeasured'}</b>
                </div>
              </div>

              <div className="active-planet-tag">
                <Compass size={12} />
                <span>{activePlanet.habitability || 'Hostile'} Zone</span>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  className="quick-explore-btn"
                  onClick={() => onNavigate('Explore', activePlanet)}
                >
                  <Orbit size={13} />
                  Inspect in 3D Stage
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          ) : (
            <div className="general-context-card">
              <Bot size={28} />
              <h4>General Astronomy</h4>
              <p>Discuss stellar evolution, telescope spectroscopy, or general exoplanet detection methods.</p>
            </div>
          )}

          {/* Dynamic Suggested Question Chips (Task #8) */}
          <div className="suggested-chips-block">
            <div className="chips-title">
              <HelpCircle size={13} />
              <span>SUGGESTED OBSERVATIONS</span>
            </div>
            <div className="chips-list">
              {currentSuggestions.map((q, idx) => (
                <button
                  key={`chip-${idx}`}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                >
                  <span>{q}</span>
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Chat Feed & Message Composer */}
        <section className="chat-window">
          {/* Chat Topbar */}
          <div className="chat-header">
            <div className="chat-status">
              <span className="live-pip" />
              <span>
                FOCUSED ON: <b>{activePlanet ? activePlanet.name : 'General Exoplanet Science'}</b>
              </span>
            </div>
            <button
              type="button"
              className="clear-chat-btn"
              onClick={handleClearChat}
              title="Clear conversation history"
            >
              <Trash2 size={13} />
              <span>Clear Log</span>
            </button>
          </div>

          {/* Message Feed */}
          <div className="messages-feed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message-row ${m.role === 'user' ? 'message-user' : 'message-ai'}`}
              >
                <div className="message-avatar">
                  {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div className="message-bubble">
                  <div className="message-meta">
                    <b>{m.role === 'user' ? 'Observer' : 'AI Astronomer'}</b>
                    {m.planetContext && (
                      <span className="context-pill">{m.planetContext}</span>
                    )}
                    <time>{m.timestamp}</time>
                  </div>
                  <div className="message-content">
                    {renderFormattedText(m.text)}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Loading Indicator */}
            {isLoading && (
              <div className="message-row message-ai loading-row">
                <div className="message-avatar">
                  <Bot size={15} />
                </div>
                <div className="message-bubble loading-bubble">
                  <div className="loading-state">
                    <Loader2 size={15} className="spin-icon" />
                    <span>Cross-referencing NASA measurements with stellar models...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="chat-composer-wrap">
            <div className="chat-composer">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activePlanet
                    ? `Ask about ${activePlanet.name} (e.g. atmosphere, water potential, tidal locking)...`
                    : 'Ask about any exoplanet or astrophysical phenomenon...'
                }
                rows={1}
                disabled={isLoading}
              />
              <button
                type="button"
                className="send-message-btn"
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="composer-foot">
              <span>Press <b>Enter</b> to send, <b>Shift+Enter</b> for newline.</span>
              <span>Grounded in NASA observational data.</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="page-footer">
        <span>AETHER AI ASTRONOMER <i>·</i> FEATHERLESS AI POWERED</span>
        <span>Habitability indicators describe orbital mechanics and potential, not proof of life.</span>
      </footer>
    </div>
  )
}
