import { SITE, SECTIONS, SECTION_ORDER } from '../content.js'

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
          <em>{SITE.tagline}</em>
        </button>

        <div className="top-right">
          <button className="ghost" onClick={toggleNight}>
            {night ? '☾ night' : '☀ day'}
          </button>
          <a className="ghost" href={`mailto:${SITE.email}`}>
            contact
          </a>
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

      <footer className="hud bottom">
        <span className="hint">drag to look around · click anything · esc to step back</span>
        <span className="socials">
          {SITE.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </span>
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
