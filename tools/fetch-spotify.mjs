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
const ARTIST_DIR = join(ROOT, 'public/artist')
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

/*
 * Artists come back with images, a name and a link, and nothing else —
 * Spotify stopped sending `genres`, `popularity` and `followers` on this
 * endpoint, so there is no point storing a field that arrives empty. The
 * order is the useful part: it is how much you actually played them.
 */
mkdirSync(ARTIST_DIR, { recursive: true })

const artists = []
for (const a of topArtists.items) {
  const photo = pickArt(a.images)
  const file = `${a.id}.jpg`
  if (photo) await download(photo, join(ARTIST_DIR, file))
  artists.push({
    id: a.id,
    name: a.name,
    photo: photo ? `/artist/${file}` : null,
    url: a.external_urls.spotify,
  })
}

/* drop images for anyone who has fallen off either list */
const prune = (dir, keep) => {
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.jpg') && !keep.has(f)) unlinkSync(join(dir, f))
  }
}
prune(ART_DIR, new Set(tracks.map((t) => `${t.id}.jpg`)))
prune(ARTIST_DIR, new Set(artists.map((a) => `${a.id}.jpg`)))

writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), tracks, artists }, null, 2) + '\n'
)

console.log(`wrote src/music.json — ${tracks.length} tracks, ${artists.length} artists`)
console.log(`images in public/album/ and public/artist/ — commit those too`)
