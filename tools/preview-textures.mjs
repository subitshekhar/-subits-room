/* Renders the room's canvas-drawn textures to PNG so they can be checked
   without hunting for them in the 3D scene.  usage: npm run textures [dir] */
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'

globalThis.document = { createElement: () => createCanvas(8, 8) }

const screens = await import('../src/scene/screens.js')
const tex = await import('../src/scene/textures.js')
/* default somewhere gitignored — writing previews into the project
   root litters it with a dozen PNGs */
const out = process.argv[2] ?? '.preview'
mkdirSync(out, { recursive: true })

const save = (name, canvasish) =>
  writeFileSync(`${out}/${name}.png`, (canvasish.image ?? canvasish).toBuffer('image/png'))

const s = screens.createScreen()
s.draw('hover', true)
save('screen', s.canvas)
save('deck', screens.createDeck())

save('sky-day', tex.createSky(false))
save('sky-night', tex.createSky(true))
save('skyline-day', tex.createSkyline(false))
save('skyline-night', tex.createSkyline(true))
save('beam', tex.createBeam())
save('note', tex.createScribbleNote(0))
save('rug', tex.createRug())
save('tv-reel', tex.createTvReel())
save('print', tex.createPhotoPrint(1))
save('shade-floor', tex.createRoomShade({ edges: ['top', 'left'], strength: 0.5 }))
save('vinyl', tex.createVinylArt())
save('portrait', tex.createPortrait())
save('shade-wall', tex.createRoomShade({ edges: ['bottom', 'left'], strength: 0.42 }))

console.log('rendered ->', out)
