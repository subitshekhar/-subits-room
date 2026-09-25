/* ---------------------------------------------------------------------------
 *  `npm run watch` — pulls poster art for SECTIONS.watch.titles into
 *  src/watch.json and public/poster/.
 *
 *  Same shape as the Spotify fetch: it runs on your machine, the key never
 *  reaches the browser, and what ships is committed JSON plus images. Your
 *  `note` on each title lives in content.js and is never touched here.
 *
 *  Needs TMDB_API_KEY in .env.local — themoviedb.org/settings/api, free.
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/poster')
const OUT = join(ROOT, 'src/watch.json')

/* w342 is the smallest TMDB size that still looks right on a retina tile */
const IMG = 'https://image.tmdb.org/t/p/w342'

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

const { TMDB_API_KEY: key } = env()
if (!key) {
  console.error('Missing TMDB_API_KEY in .env.local — get one free at themoviedb.org/settings/api')
  process.exit(1)
}

const { SECTIONS } = await import(pathToFileURL(join(ROOT, 'src/content.js')))
const wanted = SECTIONS.watch?.titles ?? []
if (!wanted.length) {
  console.error('SECTIONS.watch.titles is empty — nothing to look up.')
  process.exit(1)
}

async function search({ q, kind, year }) {
  const params = new URLSearchParams({ api_key: key, query: q })
  if (year) params.set(kind === 'tv' ? 'first_air_date_year' : 'year', String(year))
  const r = await fetch(`https://api.themoviedb.org/3/search/${kind}?${params}`)
  if (!r.ok) throw new Error(`${q} → ${r.status}`)
  const { results = [] } = await r.json()
  return results[0] ?? null
}

async function download(url, file) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`poster ${url} → ${r.status}`)
  writeFileSync(file, Buffer.from(await r.arrayBuffer()))
}

mkdirSync(DIR, { recursive: true })

const titles = []
for (const t of wanted) {
  const hit = await search(t)
  if (!hit) {
    console.warn(`  no match for "${t.q}" — left as a title card`)
    titles.push({ q: t.q, kind: t.kind })
    continue
  }
  const name = hit.title ?? hit.name
  const date = hit.release_date ?? hit.first_air_date ?? ''
  const file = `${t.kind}-${hit.id}.jpg`
  if (hit.poster_path) await download(IMG + hit.poster_path, join(DIR, file))
  titles.push({
    q: t.q,
    kind: t.kind,
    id: hit.id,
    title: name,
    year: date.slice(0, 4),
    poster: hit.poster_path ? `/poster/${file}` : null,
    url: `https://www.themoviedb.org/${t.kind}/${hit.id}`,
  })
  console.log(`  ${name} (${date.slice(0, 4)})`)
}

/* drop posters for anything no longer on the list */
const keep = new Set(titles.filter((t) => t.poster).map((t) => t.poster.split('/').pop()))
if (existsSync(DIR)) {
  for (const f of readdirSync(DIR)) {
    if (f.endsWith('.jpg') && !keep.has(f)) unlinkSync(join(DIR, f))
  }
}

writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), titles }, null, 2) + '\n'
)

console.log(`\nwrote src/watch.json — ${titles.length} titles`)
console.log('posters in public/poster/ — commit those too')
