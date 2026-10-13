/* ---------------------------------------------------------------------------
 *  `npm run pokemon` — pulls artwork and Pokédex entries for the favourites
 *  into src/pokemon.json and public/pokemon/.
 *
 *  PokéAPI needs no key. Same baked pattern as the music, the posters and
 *  the books: this runs on your machine and what ships is committed JSON
 *  plus images, so the site never calls out at runtime.
 *
 *  The list lives in SECTIONS.pokemon.favourites and is not touched here —
 *  your order, your notes. This only fetches.
 * ------------------------------------------------------------------------- */

import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { execFile as execFileCb } from 'node:child_process'

const execFile = promisify(execFileCb)

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/pokemon')
const OUT = join(ROOT, 'src/pokemon.json')

const API = 'https://pokeapi.co/api/v2'

const { SECTIONS } = await import(pathToFileURL(join(ROOT, 'src/content.js')))
const wanted = SECTIONS.pokemon?.favourites ?? []

if (!wanted.length) {
  console.error('SECTIONS.pokemon.favourites is empty — nothing to look up.')
  process.exit(1)
}

async function json(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return r.json()
}

async function download(url, file) {
  const r = await fetch(url)
  if (!r.ok) return false
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 1000) return false
  writeFileSync(file, buf)
  return true
}

/*
 * The Pokédex blurb comes straight off the original cartridges, so it
 * arrives with hard line breaks, soft hyphens left over from the GameBoy's
 * line wrapping, and POKéMON shouted in the old all-caps style. Undo all
 * three or it reads as mojibake on a web page.
 */
function dexEntry(species) {
  const hit = (species.flavor_text_entries ?? []).find((e) => e.language?.name === 'en')
  if (!hit) return ''
  return hit.flavor_text
    .replace(/\u00ad/g, '') /* soft hyphens, which split words mid-line */
    .replace(/[\n\f\r\u000c]+/g, ' ')
    .replace(/POK[Eé]MON/g, 'Pokémon')
    .replace(/\s+/g, ' ')
    .trim()
}

mkdirSync(DIR, { recursive: true })

const list = []
for (const w of wanted) {
  const slug = w.name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  let mon, species
  try {
    mon = await json(`${API}/pokemon/${slug}`)
    species = await json(`${API}/pokemon-species/${mon.id}`)
  } catch (e) {
    console.warn(`  no match for "${w.name}" — ${e.message}`)
    list.push({ q: w.name })
    continue
  }

  /* official artwork is the big painted one, not the 96px game sprite */
  const art = mon.sprites?.other?.['official-artwork']?.front_default
  const file = `${mon.id}.png`
  const got = art ? await download(art, join(DIR, file)) : false
  /* the official art is ~475px and 125KB; these are drawn at a third of
   * that, so shrink it and keep the alpha the cutout depends on */
  if (got) {
    await execFile('sips', ['-Z', '320', join(DIR, file), '--out', join(DIR, file)])
  }

  list.push({
    q: w.name,
    id: mon.id,
    name: mon.name,
    types: (mon.types ?? []).map((t) => t.type.name),
    art: got ? `/pokemon/${file}` : null,
    dex: dexEntry(species),
    url: `https://www.pokemon.com/us/pokedex/${mon.name}`,
  })
  console.log(`  #${String(mon.id).padStart(4, '0')} ${mon.name}${got ? '' : '  [no art]'}`)
}

/* drop artwork for anyone no longer on the list */
const keep = new Set(list.filter((p) => p.art).map((p) => p.art.split('/').pop()))
if (existsSync(DIR)) {
  for (const f of readdirSync(DIR)) {
    if (f.endsWith('.png') && !keep.has(f)) unlinkSync(join(DIR, f))
  }
}

writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), list }, null, 2) + '\n'
)

console.log(`\nwrote src/pokemon.json — ${list.length} entries`)
console.log('artwork in public/pokemon/ — commit those too')
