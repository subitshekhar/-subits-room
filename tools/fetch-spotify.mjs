/* ---------------------------------------------------------------------------
 *  `npm run spotify` — bakes your listening into src/music.json.
 *
 *  Nothing here runs in the browser and no token ever reaches it. Run this
 *  when you want the room to catch up with your taste, then commit the JSON
 *  and the sleeves it pulls down.
 *
 *  Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN
 *  in .env.local — `npm run spotify:auth` gets you the last one.
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ART_DIR = join(ROOT, 'public/album')
const OUT = join(ROOT, 'src/music.json')

const TRACKS = 12
const ARTISTS = 8
/* 'medium_term' is roughly the last six months, which is the honest answer
 * to "what are you listening to" — short_term swings on a single weekend. */
const RANGE = 'medium_term'

function env() {
  let raw = ''
  try {
    raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  } catch {
    /* the real environment will have to do */
  }
  const out = { ...process.env }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}

const {
  SPOTIFY_CLIENT_ID: id,
  SPOTIFY_CLIENT_SECRET: secret,
  SPOTIFY_REFRESH_TOKEN: refresh,
} = env()

if (!id || !secret || !refresh) {
  console.error(
    'Missing Spotify credentials in .env.local.\n' +
      'Run `npm run spotify:auth` first, or see the comment at the top of this file.'
  )
  process.exit(1)
}

async function accessToken() {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  })
  const body = await r.json()
  if (!r.ok) throw new Error(`refresh failed: ${body.error_description ?? r.status}`)
  return body.access_token
}

async function api(path, token) {
  const r = await fetch(`https://api.spotify.com/v1/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`)
  return r.json()
}

/* the smallest image that still looks right at the size we draw it */
const pickArt = (images = []) =>
  [...images].sort((a, b) => a.width - b.width).find((i) => i.width >= 300)?.url ??
  images[0]?.url ??
  null

async function download(url, file) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`art ${url} → ${r.status}`)
  writeFileSync(file, Buffer.from(await r.arrayBuffer()))
}

const token = await accessToken()

const [topTracks, topArtists] = await Promise.all([
  api(`me/top/tracks?limit=${TRACKS}&time_range=${RANGE}`, token),
  api(`me/top/artists?limit=${ARTISTS}&time_range=${RANGE}`, token),
])

mkdirSync(ART_DIR, { recursive: true })

const tracks = []
for (const t of topTracks.items) {
  const art = pickArt(t.album.images)
  const file = `${t.id}.jpg`
  if (art) await download(art, join(ART_DIR, file))
  tracks.push({
    id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    album: t.album.name,
    year: (t.album.release_date ?? '').slice(0, 4),
    /* served from our own origin, so the page can read its pixels back out
     * of a canvas for the colour wash without tripping over CORS */
    art: art ? `/album/${file}` : null,
    uri: t.uri,
    url: t.external_urls.spotify,
  })
}

const artists = topArtists.items.map((a) => ({
  name: a.name,
  genre: (a.genres ?? [])[0] ?? '',
  url: a.external_urls.spotify,
}))

/* drop sleeves for tracks that have fallen off the list */
const keep = new Set(tracks.map((t) => `${t.id}.jpg`))
if (existsSync(ART_DIR)) {
  for (const f of readdirSync(ART_DIR)) {
    if (f.endsWith('.jpg') && !keep.has(f)) unlinkSync(join(ART_DIR, f))
  }
}

writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), tracks, artists }, null, 2) + '\n'
)

console.log(`wrote src/music.json — ${tracks.length} tracks, ${artists.length} artists`)
console.log(`sleeves in public/album/ — commit those too`)
