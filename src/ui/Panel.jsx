import { useEffect, useMemo, useRef, useState } from 'react'
import { createSynth } from './synth.js'
import { SECTIONS } from '../content.js'

/* --------------------------------------------------- laptop: SUBIT_OS --- */

/* Reveals `text` a character at a time once `go` is true. */
function useTypewriter(text, speed = 18, go = true) {
  const [n, setN] = useState(0)

  useEffect(() => {
    setN(0)
  }, [text])

  useEffect(() => {
    if (!go || n >= text.length) return
    const id = setTimeout(() => setN((v) => v + 1), speed)
    return () => clearTimeout(id)
  }, [n, text, speed, go])

  return [text.slice(0, n), n >= text.length]
}

function Prompt({ cwd, children, caret }) {
  return (
    <p className="term-prompt">
      <span className="user">subit@room</span>
      <span className="cyan">{cwd}</span>
      <span className="sigil">$</span>
      {children}
      {caret && <span className="caret" />}
    </p>
  )
}

function Terminal({ s }) {
  const dirNames = useMemo(() => Object.keys(s.dirs), [s.dirs])
  const [cwd, setCwd] = useState(dirNames[0])
  const dir = s.dirs[cwd]

  /* boot lines land one after another, then the shell is live */
  const [bootN, setBootN] = useState(0)
  useEffect(() => {
    if (bootN >= s.boot.length) return
    const id = setTimeout(() => setBootN((n) => n + 1), 130)
    return () => clearTimeout(id)
  }, [bootN, s.boot.length])
  const booted = bootN >= s.boot.length

  const cmd = `cd ${cwd} && ls -l`
  const [typed, typedDone] = useTypewriter(cmd, 18, booted)

  /* it's a terminal — the number keys should work */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const i = Number(e.key) - 1
      if (Number.isInteger(i) && i >= 0 && i < dirNames.length) setCwd(dirNames[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirNames])

  return (
    <div className="term">
      <div className="term-boot">
        {s.boot.slice(0, bootN).map((line, i) => (
          <div key={i}>
            <span className="ok">✓</span> {line}
          </div>
        ))}
      </div>

      {booted && (
        <>
          <nav className="term-dirs">
            {dirNames.map((d, i) => (
              <button key={d} className={d === cwd ? 'on' : ''} onClick={() => setCwd(d)}>
                <kbd>{i + 1}</kbd>
                {d}
              </button>
            ))}
          </nav>

          <Prompt cwd={cwd} caret={!typedDone}>
            <span className="cmd">{typed}</span>
          </Prompt>

          {typedDone && (
            <div className="term-out" key={cwd}>
              <p className="term-blurb">{dir.blurb}</p>

              <ul className="term-list">
                {dir.items.map((it, i) => (
                  <li key={it.name} style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="row">
                      <span className="name">{it.name}</span>
                      {it.meta && <span className="meta">{it.meta}</span>}
                    </div>
                    {it.body && <p>{it.body}</p>}
                    {it.href && (
                      <a href={it.href} target="_blank" rel="noreferrer">
                        open ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>

              <Prompt cwd={cwd} caret />
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------- generic list --- */
function Groups({ s }) {
  return (
    <>
      {s.subtitle && <p className="sub">{s.subtitle}</p>}
      {s.groups.map((g) => (
        <section className="group" key={g.heading}>
          <h3>{g.heading}</h3>
          <ul className="entries">
            {g.items.map((it) => (
              <li key={it.name}>
                <div className="row">
                  <span className="name">{it.name}</span>
                  {it.meta && <span className="meta">{it.meta}</span>}
                </div>
                {it.body && <p>{it.body}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

/* ---------------------------------------------------------- liverpool --- */
function Liverpool({ s }) {
  return (
    <div className="lfc">
      <p className="sub big">{s.subtitle}</p>
      {s.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <dl className="facts">
        {s.facts.map((f) => (
          <div key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
      <p className="anthem">{s.anthem}</p>
    </div>
  )
}

/* ----------------------------------------------------------------- tv --- */
function Telly({ s }) {
  return (
    <div className="tv-ui">
      <ul className="tiles">
        {s.items.map((it) => (
          <li key={it.name}>
            <div className="tile" />
            <span className="name">{it.name}</span>
            <span className="meta">{it.meta}</span>
            {it.body && <p>{it.body}</p>}
          </li>
        ))}
      </ul>
      <h3>All-time</h3>
      <p className="chips">
        {s.allTime.map((g) => (
          <span key={g} className="chip">
            {g}
          </span>
        ))}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------- places --- */
function Places({ s }) {
  return (
    <>
      <p className="sub">{s.subtitle}</p>
      <div className="two-col">
        <section>
          <h3>Been</h3>
          <ul className="ticks">
            {s.been.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Next</h3>
          <ul className="ticks next">
            {s.next.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

/* ------------------------------------------------------------ gallery --- */
function Gallery({ s }) {
  const [open, setOpen] = useState(null)
  const shot = open === null ? null : s.shots[open]

  return (
    <div className="gallery">
      <p className="sub">{s.subtitle}</p>

      <ul className="shots">
        {s.shots.map((sh, i) => (
          <li key={sh.title}>
            <button
              onClick={() => setOpen(i)}
              style={sh.src ? undefined : { background: `linear-gradient(150deg, ${sh.tint[0]}, ${sh.tint[1]})` }}
            >
              {sh.src && <img src={sh.src} alt={sh.title} loading="lazy" />}
            </button>
            <span className="cap">{sh.title}</span>
            <span className="meta">
              {sh.place} · {sh.year}
            </span>
          </li>
        ))}
      </ul>

      {shot && (
        <div className="lightbox" onClick={() => setOpen(null)} role="presentation">
          <div
            className="big"
            style={shot.src ? undefined : { background: `linear-gradient(150deg, ${shot.tint[0]}, ${shot.tint[1]})` }}
          >
            {shot.src && <img src={shot.src} alt={shot.title} />}
          </div>
          <p>
            <strong>{shot.title}</strong>
            <span>
              {shot.place} · {shot.year}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- player --- */
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

function Player({ s }) {
  const tracks = s.tracks
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const synth = useRef(null)
  const audio = useRef(null)
  const track = tracks[index]
  const total = track.seconds || 90

  /* One synth and one audio element for the life of the panel. Closing the
   * panel unmounts this, which is what stops the sound. */
  useEffect(() => {
    synth.current = createSynth()
    audio.current = typeof Audio !== 'undefined' ? new Audio() : null
    return () => {
      synth.current?.dispose()
      if (audio.current) {
        audio.current.pause()
        audio.current.src = ''
      }
    }
  }, [])

  const go = (d) => {
    setIndex((i) => (i + d + tracks.length) % tracks.length)
    setElapsed(0)
  }

  /* the file if there is one, the generated pad if there isn't */
  useEffect(() => {
    const sy = synth.current
    const au = audio.current
    if (!playing) {
      sy?.stop()
      au?.pause()
      return
    }
    if (track.src) {
      sy?.stop()
      if (au) {
        if (!au.src.endsWith(track.src)) au.src = track.src
        au.play().catch(() => setPlaying(false))
      }
    } else {
      au?.pause()
      sy?.start(index)
    }
  }, [playing, index, track.src])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const au = audio.current
      if (track.src && au) {
        if (au.ended) go(1)
        else setElapsed(au.currentTime)
      } else {
        setElapsed((e) => e + 0.25)
      }
    }, 250)
    return () => clearInterval(id)
  }, [playing, index, track.src])

  /* advance the generated tracks at their nominal length */
  useEffect(() => {
    if (playing && !track.src && elapsed >= total) go(1)
  }, [elapsed, playing, track.src, total])

  const pct = Math.min(100, (elapsed / total) * 100)

  return (
    <div className="player">
      <p className="sub">{s.subtitle}</p>

      <div className="now">
        <div className={`disc ${playing ? 'spin' : ''}`}>
          <span />
        </div>
        <div className="now-meta">
          <span className="t">{track.title}</span>
          <span className="a">{track.artist}</span>
          {!track.src && <span className="badge">generated</span>}
        </div>
      </div>

      <div className="bar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="times">
        <span>{mmss(elapsed)}</span>
        <span>{mmss(total)}</span>
      </div>

      <div className="controls">
        <button onClick={() => go(-1)} aria-label="Previous track">
          ⏮
        </button>
        <button className="big" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button onClick={() => go(1)} aria-label="Next track">
          ⏭
        </button>
      </div>

      <h3>Queue</h3>
      <ol className="queue">
        {tracks.map((t, i) => (
          <li key={t.title} className={i === index ? 'on' : ''}>
            <button
              onClick={() => {
                setIndex(i)
                setElapsed(0)
                setPlaying(true)
              }}
            >
              <span className="n">{i === index && playing ? '▶' : String(i + 1).padStart(2, '0')}</span>
              <span className="t">{t.title}</span>
              <span className="a">{t.artist}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* -------------------------------------------------------------- notes --- */
function Notes({ s }) {
  return (
    <div className="notes">
      <p className="sub">Last updated {s.updated}</p>
      <ol>
        {s.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------ writing --- */
function Writing({ s }) {
  return (
    <>
      <p className="sub">{s.subtitle}</p>
      {s.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <ul className="entries">
        {s.entries.map((e) => (
          <li key={e.name}>
            <div className="row">
              <span className="name">{e.name}</span>
              <span className="meta">{e.meta}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

/* ------------------------------------------------------------- drawer --- */
function DrawerPanel({ s }) {
  return (
    <div className="drawer-panel">
      <p className="sub">{s.subtitle}</p>
      <ul>
        {s.items.map((x, i) => (
          <li key={i} style={{ animationDelay: `${i * 70}ms` }}>
            {x}
          </li>
        ))}
      </ul>
    </div>
  )
}

const RENDERERS = {
  terminal: Terminal,
  list: Groups,
  liverpool: Liverpool,
  tv: Telly,
  places: Places,
  notes: Notes,
  writing: Writing,
  gallery: Gallery,
  player: Player,
  drawer: DrawerPanel,
}

export default function Panel({ id, onClose }) {
  const s = id ? SECTIONS[id] : null

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!s) return null
  const Body = RENDERERS[s.kind] ?? Groups

  return (
    <div className={`panel kind-${s.kind}`} key={id}>
      <header>
        <h2>{s.title}</h2>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div className="panel-body">
        <Body s={s} />
      </div>
    </div>
  )
}
