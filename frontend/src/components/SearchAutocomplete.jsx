import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Search, X } from 'lucide-react'

// Highlights the matching substring in the planet name
function highlightMatch(text, query) {
  if (!query || !text) return text
  const trimmed = query.trim()
  if (!trimmed) return text

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase())
  if (index === -1) return text

  const before = text.slice(0, index)
  const match = text.slice(index, index + trimmed.length)
  const after = text.slice(index + trimmed.length)

  return (
    <>
      {before}
      <span className="search-match-text">{match}</span>
      {after}
    </>
  )
}

export default function SearchAutocomplete({
  query,
  setQuery,
  worlds = [],
  selected = null,
  onSelectPlanet,
  placeholder = 'Search by planet name, host star, or type...',
  autoUpdate = true,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Compute matching suggestions (top 7 YouTube-style matches)
  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return worlds
      .filter((w) => {
        const name = w.name.toLowerCase()
        const star = (w.host_star || w.star || '').toLowerCase()
        const type = (w.planet_type || w.type || '').toLowerCase()
        return name.includes(q) || star.includes(q) || type.includes(q)
      })
      .slice(0, 7)
  }, [worlds, query])

  // Automatically update selected planet and details as the user types
  useEffect(() => {
    if (!autoUpdate) return
    const q = query.toLowerCase().trim()
    if (!q) return

    // If currently selected world already matches the query, keep it
    const currentMatches =
      selected &&
      (selected.name.toLowerCase().includes(q) ||
        (selected.host_star || selected.star || '').toLowerCase().includes(q) ||
        (selected.planet_type || selected.type || '').toLowerCase().includes(q))

    // If currently selected planet does NOT match what the user is typing,
    // immediately auto-switch to the top matching world so details update instantly
    if (!currentMatches && suggestions.length > 0) {
      const timer = setTimeout(() => {
        if (onSelectPlanet) {
          onSelectPlanet(suggestions[0])
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [query, suggestions, selected, autoUpdate, onSelectPlanet])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (planet) => {
    if (onSelectPlanet) onSelectPlanet(planet)
    setQuery(planet.name)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true)
        setActiveIndex(0)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex])
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="search-autocomplete-wrap" ref={containerRef}>
      <div
        className={`search-box explore-search ${
          isOpen && query.trim() && suggestions.length > 0 ? 'search-open' : ''
        }`}
      >
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <span>⌘ K</span>
      </div>

      {/* Floating YouTube-style suggestions dropdown */}
      {isOpen && query.trim() && (
        <div className="suggestions-dropdown" role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isActive = index === activeIndex
              const isCurrent = selected?.name === item.name
              return (
                <div
                  key={item.name}
                  role="option"
                  aria-selected={isActive}
                  className={`suggestion-item ${
                    isActive ? 'suggestion-active' : ''
                  } ${isCurrent ? 'suggestion-current' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(item)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span
                    className="suggestion-orb"
                    style={{ '--sug-color': item.color || '#8bd6c3' }}
                  />
                  <div className="suggestion-info">
                    <span className="suggestion-name">
                      {highlightMatch(item.name, query)}
                    </span>
                    <span className="suggestion-meta">
                      <span>{item.host_star || item.star}</span>
                      <i>·</i>
                      <span>{item.planet_type || item.type}</span>
                    </span>
                  </div>
                  <span className="suggestion-dist">
                    {item.distance_pc ? `${item.distance_pc} pc` : item.distance}
                  </span>
                  <ArrowUpRight size={13} className="suggestion-arrow" />
                </div>
              )
            })
          ) : (
            <div className="suggestion-empty">
              No exoplanets matching “<b>{query}</b>”
            </div>
          )}
        </div>
      )}
    </div>
  )
}
