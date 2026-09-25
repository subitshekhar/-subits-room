import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createSynth } from './synth.js'
import { SECTIONS } from '../content.js'
import { setPlayback } from '../playback.js'
import MUSIC from '../music.json'

/* --------------------------------------------------- laptop: PANDA_OS --- */

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
      <span className="user">panda@room</span>
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
      <p className="anthem">
        <span>{s.anthem}</span>
        <img className="crest" src="/lfc-crest.png" alt="" aria-hidden="true" />
      </p>
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

/* ------------------------------------------------------------ records --- */

const EMBED_API = 'https://open.spotify.com/embed/iframe-api/v1'

/* Loads Spotify's embed API once, however many times this mounts. */
let apiReady = null
function spotifyApi() {
  if (apiReady) return apiReady
  apiReady = new Promise((resolve) => {
    if (window.__spotifyIFrameApi) return resolve(window.__spotifyIFrameApi)
    window.onSpotifyIframeApiReady = (api) => {
      window.__spotifyIFrameApi = api
      resolve(api)
    }
    const el = document.createElement('script')
    el.src = EMBED_API
    el.async = true
    document.head.appendChild(el)
  })
  return apiReady
}

/*
 * The colour the room borrows from a sleeve. Averaging every pixel gives mud,
 * so this keeps the saturated ones and leans on those — the wash should read
 * as "that album", not as beige.
 */
function dominantColour(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onerror = () => resolve(null)
    img.onload = () => {
      const N = 32
      const cv = document.createElement('canvas')
      cv.width = cv.height = N
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0, N, N)
      let px
      try {
        px = ctx.getImageData(0, 0, N, N).data
      } catch {
        return resolve(null)
      }
      let r = 0, g = 0, b = 0, w = 0
      for (let i = 0; i < px.length; i += 4) {
        const mx = Math.max(px[i], px[i + 1], px[i + 2])
        const mn = Math.min(px[i], px[i + 1], px[i + 2])
        /* weight by saturation, and ignore anything nearly black or white */
        const sat = mx ? (mx - mn) / mx : 0
        if (mx < 26 || mn > 232) continue
        const weight = 0.15 + sat * sat * 3
        r += px[i] * weight
        g += px[i + 1] * weight
        b += px[i + 2] * weight
        w += weight
      }
      if (!w) return resolve(null)
      const hex = (v) => Math.min(255, Math.round(v / w)).toString(16).padStart(2, '0')
      resolve(`#${hex(r)}${hex(g)}${hex(b)}`)
    }
    img.src = src
  })
}

/*
 * The shared playlist. A plain iframe rather than an API-controlled one:
 * playback_update reports whether sound is happening but never which track,
 * so wiring this to the record would spin it under whatever sleeve happened
 * to be cued. The record follows the picker above, where we know.
 */
function Playlist({ s }) {
  if (!s.playlist) return null
  return (
    <section className="playlist">
      <h3>{s.playlistHeading}</h3>
      {s.playlistNote && <p className="playlist-note">{s.playlistNote}</p>}
      <iframe
        title={s.playlistHeading}
        src={`https://open.spotify.com/embed/playlist/${s.playlist}`}
        width="100%"
        height="352"
        frameBorder="0"
        loading="lazy"
        allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
      <a
        className="playlist-open"
        href={`https://open.spotify.com/playlist/${s.playlist}`}
        target="_blank"
        rel="noreferrer"
      >
        open in Spotify ↗
      </a>
    </section>
  )
}

function Records({ s }) {
  const tracks = MUSIC.tracks ?? []
  const [cued, setCued] = useState(0)
  const host = useRef(null)
  const ctrl = useRef(null)

  const track = tracks[cued] ?? null

  /* build the embed once, then just point it at whatever is cued */
  useEffect(() => {
    if (!tracks.length || !host.current) return
    let dead = false
    spotifyApi().then((api) => {
      if (dead || !host.current) return
      api.createController(
        host.current,
        { uri: tracks[0].uri, width: '100%', height: 80 },
        (c) => {
          if (dead) return c.destroy?.()
          ctrl.current = c
          c.addListener('playback_update', (e) => {
            setPlayback({ playing: !e.data.isPaused && !e.data.isBuffering })
          })
        }
      )
    })
    return () => {
      dead = true
      setPlayback({ playing: false, track: null })
      ctrl.current?.destroy?.()
      ctrl.current = null
    }
    /* the embed is created once for the life of the panel */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length])

  /* tell the room which sleeve to take its colour from */
  useEffect(() => {
    if (!track) return
    let dead = false
    setPlayback({ track })
    if (!track.art) return
    dominantColour(track.art).then((tint) => {
      if (!dead && tint) setPlayback({ track: { ...track, tint } })
    })
    return () => {
      dead = true
    }
  }, [track])

  const cue = (i) => {
    setCued(i)
    ctrl.current?.loadUri(tracks[i].uri)
  }

  if (!tracks.length) {
    return (
      <div className="records">
        <p className="sub">{s.subtitle}</p>
        <p className="records-empty">
          Nothing baked in yet. Run <code>npm run spotify:auth</code> once, then{' '}
          <code>npm run spotify</code>, and this fills with what I have actually been playing.
        </p>
        {s.groups.map((g) => (
          <section key={g.heading} className="group">
            <h3>{g.heading}</h3>
            <ul className="items">
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
        <Playlist s={s} />
      </div>
    )
  }

  return (
    <div className="records">
      <p className="sub">{s.subtitle}</p>

      {/*
        Spotify's controller REPLACES the element it is handed with an
        iframe, so React must not own that node — it would try to remove a
        child that is no longer there on unmount. React owns the wrapper and
        Spotify gets the throwaway inside it.
      */}
      <div className="embed">
        <div ref={host} />
      </div>

      <ol className="tracklist">
        {tracks.map((t, i) => (
          <li key={t.id} className={i === cued ? 'on' : ''}>
            <button onClick={() => cue(i)}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              {t.art ? <img src={t.art} alt="" loading="lazy" /> : <span className="noart" />}
              <span className="who">
                <strong>{t.title}</strong>
                <span>{t.artist}</span>
              </span>
              <span className="yr">{t.year}</span>
            </button>
          </li>
        ))}
      </ol>

      {MUSIC.artists?.length > 0 && (
        <section className="group">
          <h3>On heavy rotation</h3>
          <ul className="items">
            {MUSIC.artists.map((a) => (
              <li key={a.name}>
                <div className="row">
                  <span className="name">{a.name}</span>
                  {a.genre && <span className="meta">{a.genre}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Playlist s={s} />

      {MUSIC.generated && <p className="records-stamp">Counted up to {MUSIC.generated}.</p>}
    </div>
  )
}

/* ------------------------------------------------------------ gallery --- */
/* Fallback wash for a shot with no file yet. */
const tintOf = (sh) => `linear-gradient(150deg, ${sh.tint?.[0] ?? '#8fa6bd'}, ${sh.tint?.[1] ?? '#3a4658'})`

function Gallery({ s, night }) {
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
              style={sh.src ? undefined : { background: tintOf(sh) }}
            >
              {sh.src && <img src={sh.src} alt={sh.title} loading="lazy" />}
            </button>
            <span className="cap">{sh.title}</span>
            <span className="meta">{[sh.place, sh.year].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>

      {/*
        Portalled to the body. Inside the panel it picked up the panel's
        zoom on top of its own, and Chrome makes a zoomed ancestor the
        containing block for fixed children — so `inset: 0` resolved to the
        panel's box and the backdrop covered a corner instead of the screen.
        Out here it is also outside `.app`, which is where the theme lives,
        so it carries its own copy of the class.
      */}
      {shot &&
        createPortal(
          <div
            className={`lightbox ${night ? 'is-night' : 'is-day'}`}
            onClick={() => setOpen(null)}
            role="presentation"
          >
            <div
              className="big"
              style={shot.src ? undefined : { background: tintOf(shot) }}
            >
              {shot.src && <img src={shot.src} alt={shot.title} />}
            </div>
            <p>
              <strong>{shot.title}</strong>
              <span>{[shot.place, shot.year].filter(Boolean).join(' · ')}</span>
            </p>
          </div>,
          document.body
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
  records: Records,
  gallery: Gallery,
  player: Player,
  drawer: DrawerPanel,
}

export default function Panel({ id, night, onClose }) {
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
        <Body s={s} night={night} />
      </div>
    </div>
  )
}
