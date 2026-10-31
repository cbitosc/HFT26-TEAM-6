
import { useState } from 'react'
import { Lightbulb, ArrowRight } from 'lucide-react'

const facts = [
  {
    title: 'A planet with two suns!',
    description:
      'Kepler-16b orbits two stars, much like the fictional planet Tatooine from Star Wars.',
    source: 'NASA',
  },
  {
    title: 'Seven Earth-sized worlds',
    description:
      'The TRAPPIST-1 system contains seven known Earth-sized planets orbiting a single star.',
    source: 'NASA',
  },
  {
    title: 'Our nearest exoplanet neighbour',
    description:
      'Proxima Centauri b orbits Proxima Centauri, the closest star to our Solar System.',
    source: 'ESO',
  },
  {
    title: 'The first discovery around a Sun-like star',
    description:
      '51 Pegasi b was discovered in 1995, becoming the first confirmed exoplanet orbiting a Sun-like star.',
    source: 'NASA',
  },
  {
    title: 'Carbon dioxide in an alien atmosphere',
    description:
      'The James Webb Space Telescope detected carbon dioxide in the atmosphere of WASP-39 b.',
    source: 'NASA',
  },
  {
    title: 'An extremely hot world',
    description:
      'WASP-12 b is so close to its host star that its atmosphere is being stretched and lost into space.',
    source: 'NASA',
  },
  {
    title: 'Thousands of worlds discovered',
    description:
      'Astronomers have confirmed thousands of planets beyond our Solar System using different detection methods.',
    source: 'NASA',
  },
]

export default function DidYouKnow() {
  const [index, setIndex] = useState(0)

  const fact = facts[index]

  const nextFact = () => {
    setIndex((current) => (current + 1) % facts.length)
  }

  return (
    <section className="did-you-know">
      <div className="dyk-heading">
        <span className="dyk-icon">
          <Lightbulb size={18} />
        </span>
        <span>DID YOU KNOW?</span>
        <span className="dyk-count">
          {index + 1} / {facts.length}
        </span>
      </div>

      <h3>{fact.title}</h3>

      <p>{fact.description}</p>

      <div className="dyk-footer">
        <span>Source: {fact.source}</span>

        <button type="button" onClick={nextFact}>
          Next fact <ArrowRight size={14} />
        </button>
      </div>
    </section>
  )
}
