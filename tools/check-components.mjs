/*
 * Every JSX component referenced must actually be defined or imported.
 *
 * `vite build` does not catch this — an undefined identifier is only a
 * ReferenceError at render time, which shows up as a blank room. This has
 * bitten three times now (AdditiveBlending, Gallery/Player, and a slice
 * between two section comments that quietly deleted Couch and FloorLamp).
 *
 *   npm run check
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const INTRINSIC = /^[a-z]/ /* <mesh>, <group>, <planeGeometry> … */
const files = []
for (const dir of ['src', 'src/scene', 'src/ui']) {
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.jsx')) files.push(join(dir, f))
  }
}

let bad = 0
for (const file of files) {
  /* strip comments: a <Tag> mentioned in prose is not a reference */
  const src = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')

  const defined = new Set()
  for (const m of src.matchAll(/(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/g)) defined.add(m[1])
  /* anything pulled in from another module */
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from/g)) {
    for (const name of m[1].replace(/[{}]/g, ' ').split(',')) {
      const clean = name.trim().split(/\s+as\s+/).pop()
      if (clean) defined.add(clean)
    }
  }

  const used = new Set()
  for (const m of src.matchAll(/<([A-Za-z][A-Za-z0-9_.]*)/g)) {
    const tag = m[1].split('.')[0]
    if (!INTRINSIC.test(tag)) used.add(tag)
  }

  const missing = [...used].filter((n) => !defined.has(n))
  if (missing.length) {
    bad++
    console.log(`${file}\n  undefined: ${missing.join(', ')}`)
  }
}

console.log(bad ? `\n${bad} file(s) with undefined components` : `all components defined across ${files.length} files`)

/*
 * Section ids are the other thing a green build will happily lie about.
 * Renaming a section leaves SECTION_ORDER, FOCUS and the Hotspot ids
 * pointing at a key that no longer exists; the bundle compiles and the page
 * renders blank. Check the three agree.
 */
const { SECTIONS, SECTION_ORDER } = await import('../src/content.js')
const { FOCUS } = await import('../src/scene/focus.js')
const ids = new Set(Object.keys(SECTIONS))

for (const id of SECTION_ORDER) {
  if (!ids.has(id)) {
    bad++
    console.log(`SECTION_ORDER has '${id}', which is not a section`)
  }
}
for (const id of ids) {
  const s = SECTIONS[id]
  /* an empty `hotspot` marks a section that is meant to be found, not listed,
   * and `listed: false` says the same thing out loud for one that has an
   * object in the room but deliberately no row in the index */
  if (!s.hotspot || s.listed === false) continue
  if (!SECTION_ORDER.includes(id)) {
    bad++
    console.log(`section '${id}' is missing from SECTION_ORDER — list it, or mark it listed: false`)
  }
}

const objects = readFileSync(new URL('../src/scene/Objects.jsx', import.meta.url), 'utf8')
for (const m of objects.matchAll(/\bid="([a-z0-9_-]+)"/g)) {
  const id = m[1]
  if (!ids.has(id)) {
    bad++
    console.log(`Hotspot id="${id}" has no section`)
  } else if (!FOCUS[id]) {
    bad++
    console.log(`Hotspot id="${id}" has no FOCUS entry`)
  }
}

if (!bad) console.log(`${ids.size} sections line up with SECTION_ORDER, FOCUS and the hotspots`)
process.exit(bad ? 1 : 0)
