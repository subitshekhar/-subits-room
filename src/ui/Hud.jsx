import { useEffect, useRef, useState } from 'react'
import { SITE, SECTIONS, SECTION_ORDER } from '../content.js'

/* ------------------------------------------------------------- icons --- */
/* Drawn here rather than shipped as files: at 18px a sprite sheet costs a
 * request to save nothing, and these inherit currentColor for free. */
const Icon = {
  moon: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
    </>
  ),
  mail: (
    <>
      <rect x="2.6" y="4.8" width="18.8" height="14.4" rx="2.2" />
      <path d="M3.4 6.6L12 13.2l8.6-6.6" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .6A11.4 11.4 0 0 0 8.4 22.8c.57.1.78-.25.78-.55v-2c-3.17.69-3.84-1.53-3.84-1.53-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.09 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.25.72-1.53-2.54-.29-5.2-1.27-5.2-5.63 0-1.25.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17a10.9 10.9 0 0 1 5.72 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.81 1.17 3.06 0 4.37-2.67 5.33-5.21 5.62.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.79.55A11.4 11.4 0 0 0 12 .6z"
    />
  ),
  linkedin: (
    <>
      <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="3" />
      <path d="M7 10.4v7M7 6.9v.1M11.2 17.4v-7M11.2 13.6c0-1.6 1-2.6 2.4-2.6s2.4 1 2.4 2.6v3.8" />
    </>
  ),
}

function Glyph({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Icon[name]}
    </svg>
  )
}

/*
 * The three ways to reach me, fanned out along a quarter arc from a single
 * button. Angles are measured from the horizontal so the items sit on a
 * true circle rather than on a guessed diagonal, and the dashed guide is
 * the same radius — it is the path they travel, not decoration.
 *
 * The trigger lives in the bottom-right corner, so the fan opens up and to
 * the left: 90 degrees is straight up and the rest lean in from there.
 */
const ORBIT_R = 96
const SPOKES = [
  { key: 'mail', angle: 162, label: 'email' },
  { key: 'github', angle: 126, label: 'GitHub' },
  { key: 'linkedin', angle: 90, label: 'LinkedIn' },
]

const polar = (angle, r = ORBIT_R) => ({
  x: Math.cos((angle * Math.PI) / 180) * r,
  y: -Math.sin((angle * Math.PI) / 180) * r,
})

function Orbit() {
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  /* escape closes it, and so does a click anywhere else */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const href = { mail: `mailto:${SITE.email}`, github: null, linkedin: null }
  for (const s of SITE.socials) {
    if (/github/i.test(s.label)) href.github = s.href
    if (/linkedin/i.test(s.label)) href.linkedin = s.href
  }

  const a = polar(SPOKES[0].angle)
  const b = polar(SPOKES[SPOKES.length - 1].angle)

  return (
    <div className={`orbit ${open ? 'is-open' : ''}`} ref={box}>
      {/*
        The arc the buttons ride. The svg is the same 44px box as the
        trigger and simply overflows, so its centre IS the trigger's centre
        and the guide cannot drift from the buttons.
      */}
      <svg className="orbit-arc" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
        <path
          d={`M ${22 + a.x} ${22 + a.y} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${22 + b.x} ${22 + b.y}`}
          fill="none"
          strokeDasharray="3 6"
        />
      </svg>

      <ul>
        {SPOKES.map((s, i) => {
          const { x, y } = polar(s.angle)
          return (
            <li key={s.key} style={{ '--x': `${x}px`, '--y': `${y}px`, '--i': i }}>
              <a
                href={href[s.key]}
                target={s.key === 'mail' ? undefined : '_blank'}
                rel={s.key === 'mail' ? undefined : 'noreferrer'}
                aria-label={s.label}
                tabIndex={open ? 0 : -1}
              >
                <Glyph name={s.key} />
                <span className="orbit-label">{s.label}</span>
              </a>
            </li>
          )
        })}
      </ul>

      <button
        className="orbit-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close contact links' : 'Contact links'}
      >
        {/* it cheers up once someone finally opens it */}
        <span className="face" aria-hidden="true">
          {open ? 'ಠ‿ಠ' : 'ಠ_ಠ'}
        </span>
      </button>
    </div>
  )
}


/* Splits the tagline on asterisks; the odd pieces get set apart. */
function Tagline({ text }) {
  return text.split('*').map((part, i) => (i % 2 ? <span key={i} className="fu">{part}</span> : part))
}

export default function Hud({ night, toggleNight, active, select, reset, loaded, hovered, setHovered }) {
  /* Hovering a row lights the object in the room, and vice versa — the two
   * were previously unaware of each other. */
  const link = (id) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered((h) => (h === id ? null : h)),
    onFocus: () => setHovered(id),
    onBlur: () => setHovered((h) => (h === id ? null : h)),
  })

  return (
    <>
      <header className="hud top">
        <button className="brand" onClick={reset}>
          {SITE.name}
          <em>
            <Tagline text={SITE.tagline} />
          </em>
        </button>

        <div className="top-right">
          <button
            className="ghost icon"
            onClick={toggleNight}
            aria-label={night ? 'Switch to day' : 'Switch to night'}
          >
            <Glyph name={night ? 'moon' : 'sun'} />
          </button>
        </div>
      </header>

      <nav className="hud index">
        <span className="index-label">in this room</span>
        <ul>
          {SECTION_ORDER.map((id, i) => (
            <li key={id}>
              <button
                className={`${active === id ? 'on' : ''} ${hovered === id ? 'hot' : ''}`}
                onClick={() => select(id)}
                {...link(id)}
              >
                <span className="i-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="i-dot" />
                <span className="i-sec">{SECTIONS[id].nav}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Orbit />

      <footer className="hud bottom">
        <span className="hint">drag to look around · click anything · esc to step back</span>
      </footer>

      {!loaded && (
        <div className="boot">
          <div className="boot-inner">
            <h1>{SITE.name}</h1>
            <p>building the room…</p>
          </div>
        </div>
      )}
    </>
  )
}
