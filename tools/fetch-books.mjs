/* ---------------------------------------------------------------------------
 *  `npm run books` — pulls cover art for everything on the shelf into
 *  src/books.json and public/cover/.
 *
 *  Open Library needs no key and no account, which is why it is here rather
 *  than Google Books. Same baked pattern as the music and the posters: this
 *  runs on your machine, and what ships is committed JSON plus images.
 *
 *  The shelf itself lives in SECTIONS.think.groups and is not touched —
 *  your headings, your order, your notes. This only adds pictures.
 * ------------------------------------------------------------------------- */

import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/cover')
const OUT = join(ROOT, 'src/books.json')

/* -M is about 180px wide, which is plenty at the size these are drawn */
const IMG = (id) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`

const { SECTIONS } = await import(pathToFileURL(join(ROOT, 'src/content.js')))

/* every item across every group, flattened, keeping the title and author */
const wanted = (SECTIONS.think?.groups ?? []).flatMap((g) =>
  g.items.map((it) => ({ q: it.name, author: it.meta }))
)

if (!wanted.length) {
  console.error('SECTIONS.think.groups is empty — nothing to look up.')
  process.exit(1)
}

async function query(params) {
  const r = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!r.ok) throw new Error(`${r.status}`)
  const { docs = [] } = await r.json()
  return docs
}

/*
 * Take the best match that actually has a cover rather than the top hit.
 * The top hit is often a reprint Open Library holds no jacket for, and a
 * blank tile next to six real ones looks like a bug rather than a gap.
 */
async function search({ q, author }) {
  const fields = 'title,author_name,first_publish_year,cover_i,key'

  /* title and author as separate fields beats one blob: a title that is
   * also a common word otherwise drags in the wrong book entirely */
  const narrow = new URLSearchParams({ title: q, limit: '8', fields })
  if (author) narrow.set('author', author)

  let docs = await query(narrow)
  let hit = docs.find((d) => d.cover_i) ?? docs[0] ?? null
  if (hit?.cover_i) return hit

  /* nothing jacketed under that author — widen to the title alone, but keep
   * the unjacketed match as the fallback so we still get the metadata */
  docs = await query(new URLSearchParams({ title: q, limit: '8', fields }))
  return docs.find((d) => d.cover_i) ?? hit
}

async function download(url, file) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`cover ${url} → ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  /* Open Library answers 200 with a 1x1 blank when it has no cover on file,
   * so size is the only honest test of whether we actually got one */
  if (buf.length < 1000) return false
  writeFileSync(file, buf)
  return true
}

mkdirSync(DIR, { recursive: true })

const books = []
for (const w of wanted) {
  let hit = null
  try {
    hit = await search(w)
  } catch (e) {
    console.warn(`  ${w.q}: ${e.message}`)
  }

  if (!hit) {
    console.warn(`  no match for "${w.q}" — left as a title card`)
    books.push({ q: w.q })
    continue
  }

  let cover = null
  if (hit.cover_i) {
    const file = `${hit.cover_i}.jpg`
    if (await download(IMG(hit.cover_i), join(DIR, file))) cover = `/cover/${file}`
  }

  books.push({
    q: w.q,
    title: hit.title,
    author: (hit.author_name ?? [])[0] ?? w.author ?? '',
    year: hit.first_publish_year ? String(hit.first_publish_year) : '',
    cover,
    url: hit.key ? `https://openlibrary.org${hit.key}` : null,
  })
  console.log(`  ${hit.title} (${hit.first_publish_year ?? '?'})${cover ? '' : '  [no cover]'}`)
}

/* drop covers for anything no longer on the shelf */
const keep = new Set(books.filter((b) => b.cover).map((b) => b.cover.split('/').pop()))
if (existsSync(DIR)) {
  for (const f of readdirSync(DIR)) {
    if (f.endsWith('.jpg') && !keep.has(f)) unlinkSync(join(DIR, f))
  }
}

writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), books }, null, 2) + '\n'
)

const got = books.filter((b) => b.cover).length
console.log(`\nwrote src/books.json — ${books.length} books, ${got} with covers`)
console.log('covers in public/cover/ — commit those too')
