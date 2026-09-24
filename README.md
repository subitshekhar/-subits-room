# Subit's Room

> Don't read my résumé. Come into my room.

A personal website that is a room. The room *is* the navigation — you click the
laptop to find the work, the scarf to find Liverpool, the drawer to find the
things that were never meant to be found.

```
npm install
npm run dev
```

`npm run textures` renders every canvas-drawn texture to PNG so you can judge
them flat instead of squinting at the 3D scene. `npm run focus` checks that each
object's camera position survives the orbit limits — a focus outside them gets
silently yanked somewhere else the moment the flight lands. `npm run check`
verifies every JSX component referenced is actually defined or imported:
`vite build` happily passes an undefined identifier, which then shows up as a
blank room at runtime rather than a build error.

## The map

The PLACES board loads `public/places-map.svg` — replace that file and the
board changes. The SVG carries its own pins and labels, so there is no
geometry on top of it to fall out of register. The plane is 1.6:1 to match the
file's 1600x1000 viewBox; a different ratio stretches the labels. Fonts inside
an SVG loaded as a texture fall back to system faces, which is why the file
names Georgia and monospace as fallbacks.

## The photo on the wall

The Liverpool frame loads `public/mosalah.png`. Swap it by replacing that file,
or point `photo` in the `liverpool` section of `content.js` somewhere else.
Portrait, roughly 3:4 — the print plane is 0.55 x 0.75. Set it to `null` and
the room falls back to a drawn silhouette.

## Photos and music

**The camera** opens a grid from `photos.shots`. Each shot renders as a tinted
placeholder until you give it a `src` (drop files in `public/photos/`), at which
point the same grid shows the real images. Clicking one enlarges it.

**The speaker** opens a real player. Give a track a `src` and it plays that
file; leave it `null` and `ui/synth.js` improvises a slow pad in that key with
the Web Audio API, so the button does something before you've added any audio.
Closing the panel tears the audio context down.

## The idea

No conventional nav. You land inside a stylized 3D room, drag to look around,
and every object opens a different part of the story. A thin HUD stays on top
so nobody gets lost, but the room does the work.

## What's in the room

| Object | Opens | Panel style |
|---|---|---|
| Laptop | `work` | A fake terminal — `SUBIT_OS`, with `~/work`, `~/projects`, `~/experiments`, `~/ideas` |
| Bookshelf | `think` | Philosophy / psychology / maths / fiction |
| Framed photo | `liverpool` | "This one needs no explanation." |
| TV + PS5 | `play` | A console UI — "Continue playing" |
| Model car on the shelf | `machines` | Cars, bikes, engines |
| Camera on the shelf | `photos` | A grid of shots, click one to enlarge |
| Speaker on the shelf | `listen` | A working player — see below |
| Framed vinyl | `music` | |
| Squash racquet | `sport` | |
| Map + postcards | `places` | Been / Next |
| Notebook on the desk | `thinking` | The living list of open questions |
| Bed | `bed` | 3:00 AM — the unexpected one |
| **The drawer** | `drawer` | Not in the menu. It slides open when you click it. |
| **The desk lamp** | — | Not a panel. Clicking it flips the room to night. |

## Editing it

**All the writing lives in `src/content.js`.** Nothing else needs to change to
keep the site current — edit that file, refresh, done. The `kind` field on each
section decides how its panel renders (`terminal`, `list`, `liverpool`, `tv`,
`places`, `notes`, `writing`, `drawer`); the renderers are in `src/ui/Panel.jsx`.

Keep `thinking.notes` genuinely current — it's the thing that makes the site
feel alive rather than shipped-once-and-abandoned.

## Moving things around

```
src/
  content.js            all copy, one file
  roomContext.jsx       room dimensions + the camera's resting position
  App.jsx               canvas, lights, day/night state
  scene/
    palette.js          every colour, plus the day and night moods
    Shell.jsx           floor, walls, the window opening, the city, the sunbeam
    Objects.jsx         every prop in the room
    Hotspot.jsx         makes any cluster of meshes clickable
    CameraRig.jsx       flies the camera, then hands control back to the mouse
  ui/
    Panel.jsx           the overlay panels
    Hud.jsx             brand, index, day/night, footer
```

`ROOM` in `roomContext.jsx` defines the box everything is positioned against.
`FOCUS` in `scene/focus.js` is where the camera lands for each object — if you move
an object, move its focus entry too.

## Foliage

`ui/Foliage.jsx` draws the out-of-focus leaves around the edges of the page.
It's SVG, not an image: leaves strung along quadratic stems, rendered three
times at different blurs — a soft shadow cast on the background, a far layer
and a near one. The depth comes from the blur, not from the drawing. It
retints for night and never takes pointer events.

Add or move clusters by editing the `sets` in that file and the matching
anchor rules (`.f-tl`, `.f-ml`, `.f-bl`, `.f-r`) in `styles.css`. Night uses a
lifted, moonlit green — near-black leaves on a near-black page are invisible.

## Hover highlight

Hovering marks a hotspot's contents as selected (`<Select>` in
`scene/Hotspot.jsx`); the `Outline` effect in `App.jsx` then edge-detects the
whole selection and traces its silhouette.

This needs postprocessing because it cannot be done per mesh. Two earlier
attempts failed instructively: a soft billboard behind the object floated in
front of flat wall pieces as a visible wash — and, being a three-unit plane
inside the hotspot group, it swallowed pointer events far outside the object,
so hovering the laptop raised the map's label. Expanding each mesh into its
own shell fixed the pointer bug but outlined every book and every shelf board,
because a per-mesh trick has no idea where the *object's* edge is.

Note `<EffectComposer>` must not be given `autoClear={false}` here — it
suppresses the clear its render pass depends on and the room disappears.

Anything decorative (light pools, beams, shadow blobs) is tagged `DECOR` /
`NO_HIT` from `scene/decor.js`: no pointer events, no outline.

## What's on the television

`createTvReel` draws four shots side by side on one strip — a lake, a city at
dusk, forested ridges, open sea. The screen shows a 704-wide window of it
(`RepeatWrapping` + `repeat.x`), drifts slowly across the current shot, then
jumps a whole panel to cut to the next. Only `texture.offset.x` changes per
frame, so nothing is redrawn or re-uploaded; redrawing a canvas every frame
would mean pushing megabytes to the GPU continuously.

Panels are deliberately wider than the window so the drift can never run into
the neighbouring shot and show a seam. Change `SHOT_SECONDS` in `Objects.jsx`
for the cut rhythm.

The television stands on a neck rather than sitting flat on the unit — with
the panel's bottom edge at shelf height, anything else on the shelf
intersects the picture.

## The figure on the couch

`Gamer` in `scene/Objects.jsx` sits inside the couch's own group, so it
inherits the couch's rotation and faces the television without any extra
maths. At this size proportion does all the work and detail does none: a
single fat capsule for the torso reads as a barrel, so the shoulders are a
separate crosswise capsule; a shin longer than its thigh reads as a puppet,
so both are the same length, which the seat height then fixes. The hair is a
cap that follows the skull — an extra sphere behind the head reads as a bun.

## Plants

`makeLeaf` in `scene/Objects.jsx` builds a leaf as a ribbon of quads that arcs
over, widens past the base and tapers to a point, with a shallow crease down
the centre so it catches light along its length. Three shapes are generated
once and shared; every plant varies them by scale, lean, twist and colour.
`PottedPlant` takes `leaves`, `height`, `spread`, `droop` and `seed` — raise
`droop` for the trailing ones on top of the bookshelf.

## Light at night

Night is lit by the objects, not by a global lamp: the desk lamp, a table lamp
on the side table by the couch, warm strips tucked under each bookshelf shelf,
two candles, the laptop and the television. A single dim warm point light sits
high in the middle of the room — without it everything between the pools falls
to near-black. All of it keys off the `night` flag in `scene/palette.js`.

## A note on soft things

Light shafts, haze, the shadow gathering in the wall corners and the halo behind
a hovered object are all **gradient textures**, generated in `scene/textures.js`.
None of them are geometry. Geometry gives you hard edges, and a hard edge in a
soft thing reads as a rendering artefact rather than as light.

`npm run textures` writes them all out as PNGs so you can judge them flat.

## Day and night

`MOODS` in `src/scene/palette.js` holds both looks — background, fog, ambient,
sun, the city outside, and the sunbeam's strength. At night the lamp, laptop,
TV and the city windows all light up, and the overlay UI retints via the
`.is-night` class in `styles.css`.

This is the hook for having different content by time of day: the `night` flag
is already threaded through the scene, so a section can read it too.

## Where this goes next

The room is generated entirely in code right now — no Blender, no asset
download, which is why it loads instantly and why every object is a few lines
you can nudge. That was deliberate for draft one.

Draft two is where you'd model the room properly in Blender, export a single
compressed `.glb`, and swap `Objects.jsx` for a loaded scene — keeping
`Hotspot.jsx`, `CameraRig.jsx`, the panels and `content.js` exactly as they are.
The interaction layer is already independent of how the geometry gets made.

Other things worth stealing from the original sketch:

- Real photos on the postcards and the TV tiles
- A record player, or audio on the guitar
- More secrets — the room rewards people who click the boring objects
