import { CanvasTexture, SRGBColorSpace, LinearFilter, ClampToEdgeWrapping } from 'three'

/* ---------------------------------------------------------------------------
 * Generated textures. Anything that should read as *soft* — light shafts,
 * haze, corner shadow, a glow behind a hovered object — is a gradient here
 * rather than geometry in the scene, because geometry gives you hard edges
 * and hard edges look like rendering artefacts.
 * ------------------------------------------------------------------------- */

function surface(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  return { canvas, ctx }
}

function finish(canvas) {
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.wrapS = ClampToEdgeWrapping
  tex.wrapT = ClampToEdgeWrapping
  tex.anisotropy = 4
  return tex
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/* ------------------------------------------- soft round glow (additive) --- */
export function createGlow(inner = 'rgba(255,255,255,0.85)') {
  const S = 256
  const { canvas, ctx } = surface(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, 'rgba(255,255,255,0.28)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.06)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return finish(canvas)
}

/* ----------------------------------------- soft dark blob, for grounding --- */
export function createShadowBlob(strength = 0.55) {
  const S = 256
  const { canvas, ctx } = surface(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, `rgba(0,0,0,${strength})`)
  g.addColorStop(0.45, `rgba(0,0,0,${strength * 0.45})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return finish(canvas)
}

/* ------------------------------ one-sided falloff, for corner occlusion --- */
/* Dark along the top edge, fading to nothing. Rotate the plane to aim it. */
export function createEdgeShade(strength = 0.42) {
  const W = 8
  const H = 128
  const { canvas, ctx } = surface(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, `rgba(0,0,0,${strength})`)
  g.addColorStop(0.35, `rgba(0,0,0,${strength * 0.3})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  return finish(canvas)
}

/* -------------------------------------------------- the shaft of light --- */
/* Bright at the window end, feathered on every edge, gone by the far end. */
export function createBeam() {
  const W = 128
  const H = 256
  const { canvas, ctx } = surface(W, H)

  const along = ctx.createLinearGradient(0, 0, 0, H)
  along.addColorStop(0, 'rgba(255,236,200,0.85)')
  along.addColorStop(0.45, 'rgba(255,228,182,0.4)')
  along.addColorStop(1, 'rgba(255,220,170,0)')
  ctx.fillStyle = along
  ctx.fillRect(0, 0, W, H)

  /* feather the long edges so the shaft has no silhouette */
  const across = ctx.createLinearGradient(0, 0, W, 0)
  across.addColorStop(0, 'rgba(0,0,0,1)')
  across.addColorStop(0.22, 'rgba(0,0,0,0)')
  across.addColorStop(0.78, 'rgba(0,0,0,0)')
  across.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = across
  ctx.fillRect(0, 0, W, H)

  return finish(canvas)
}

/* ------------------------------------ the pool it makes on floor / bed --- */
export function createSunPatch() {
  const S = 256
  const { canvas, ctx } = surface(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,224,168,0.85)')
  g.addColorStop(0.5, 'rgba(255,216,150,0.34)')
  g.addColorStop(1, 'rgba(255,210,140,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return finish(canvas)
}

/* ------------------------------------------------- the world outside ----- */
/*
 * Sky, haze and skyline in a single texture. The city is *drawn* into the
 * haze rather than modelled, so it can never compete with the room for
 * detail and there is no geometry out there to catch a stray highlight.
 */
/*
 * Sky only. The city lives on its own plane (createSkyline) because the
 * window is a narrow aperture: drawn at the sky's scale it framed exactly
 * one tower, which reads as a grey rectangle rather than a skyline.
 */
export function createSky(night) {
  const W = 1024
  const H = 512
  const { canvas, ctx } = surface(W, H)
  const horizon = H * 0.72

  const stops = night
    ? [
        [0, '#05080f'],
        [0.5, '#0d1630'],
        [0.78, '#1d2745'],
        [1, '#2b2f46'],
      ]
    : [
        [0, '#7fb4dc'],
        [0.5, '#a8cde6'],
        [0.8, '#dbe4e6'],
        [1, '#efe2cb'],
      ]
  const g = ctx.createLinearGradient(0, 0, 0, H)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  /* Haze: wash the horizon back toward the sky so the city never reads as
   * detail. Starts at zero alpha — any non-zero first stop leaves a seam. */
  const hazeTop = horizon - 150
  const haze = ctx.createLinearGradient(0, hazeTop, 0, horizon + 40)
  const hazeCol = night ? '29,39,69' : '219,228,230'
  haze.addColorStop(0, `rgba(${hazeCol},0)`)
  haze.addColorStop(0.45, `rgba(${hazeCol},0.55)`)
  haze.addColorStop(0.8, `rgba(${hazeCol},0.88)`)
  haze.addColorStop(1, `rgba(${hazeCol},1)`)
  ctx.fillStyle = haze
  ctx.fillRect(0, hazeTop, W, horizon + 40 - hazeTop)

  /* ground, blended out of the haze rather than butted against it */
  const groundCol = night ? '#232a44' : '#e3ddd2'
  const ground = ctx.createLinearGradient(0, horizon + 10, 0, horizon + 90)
  ground.addColorStop(0, `rgba(${hazeCol},1)`)
  ground.addColorStop(1, groundCol)
  ctx.fillStyle = ground
  ctx.fillRect(0, horizon + 10, W, 80)
  ctx.fillStyle = groundCol
  ctx.fillRect(0, horizon + 89, W, H - horizon - 89)

  return finish(canvas)
}

/* -------------------------------------------- sticky notes with writing -- */
export function createScribbleNote(seed = 1) {
  const W = 256
  const H = 320
  const { canvas, ctx } = surface(W, H)

  ctx.fillStyle = ['#f2ead8', '#efe4c6', '#e8eef2'][seed % 3]
  ctx.fillRect(0, 0, W, H)

  /* a pretend sketch: a box-and-arrow diagram, or handwriting */
  ctx.strokeStyle = 'rgba(40,46,58,0.55)'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'

  if (seed % 3 === 0) {
    ctx.strokeRect(38, 48, 82, 52)
    ctx.strokeRect(140, 132, 82, 52)
    ctx.beginPath()
    ctx.moveTo(120, 74)
    ctx.bezierCurveTo(158, 74, 150, 110, 178, 130)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(178, 130)
    ctx.lineTo(168, 116)
    ctx.moveTo(178, 130)
    ctx.lineTo(186, 114)
    ctx.stroke()
  }

  /* handwriting: wobbly lines of varying length */
  ctx.lineWidth = 2
  let y = seed % 3 === 0 ? 216 : 44
  let i = 0
  while (y < H - 26) {
    const len = 58 + rand(seed * 5 + i) * 150
    ctx.beginPath()
    ctx.moveTo(30, y)
    for (let x = 30; x < 30 + len; x += 9) {
      ctx.lineTo(x, y + Math.sin((x + seed * 30) * 0.42) * 2.1)
    }
    ctx.stroke()
    y += 24
    i++
  }

  return finish(canvas)
}

/* ------------------------------------------------------------- steam ----- */
export function createSteam() {
  const S = 128
  const { canvas, ctx } = surface(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.5)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.16)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return finish(canvas)
}

/* -------------------------------------------- baked corner occlusion ----- */
/*
 * A transparent sheet darkened along whichever edges you name. Laid over the
 * floor and the inner wall faces, this is the soft gathering of shadow where
 * surfaces meet — the thing that stops the room looking like flat cardboard.
 *
 * Edges are named in *texture* space: with the sheet laid flat by
 * rotation [-PI/2, 0, 0], `top` is the far (-z) wall and `left` is the -x
 * wall. On an untransformed upright plane, `bottom` is the floor.
 */
export function createRoomShade({ edges = [], strength = 0.5, spread = 0.34, size = 512 } = {}) {
  const { canvas, ctx } = surface(size, size)

  const band = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, `rgba(0,0,0,${strength})`)
    g.addColorStop(0.28, `rgba(0,0,0,${strength * 0.34})`)
    g.addColorStop(0.62, `rgba(0,0,0,${strength * 0.08})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }

  const s = size * spread
  ctx.globalCompositeOperation = 'source-over'
  if (edges.includes('top')) band(0, 0, 0, s)
  if (edges.includes('bottom')) band(0, size, 0, size - s)
  if (edges.includes('left')) band(0, 0, s, 0)
  if (edges.includes('right')) band(size, 0, size - s, 0)

  return finish(canvas)
}

/* -------------------------------------------- framed vinyl, for MUSIC ---- */
/*
 * The record used to be painted into the same canvas as its mount board.
 * It turns now, so it needs its own texture: the board stays put and the
 * disc spins on top of it. The spindle also moved back to the true centre,
 * because anything off-axis wobbles the moment the thing rotates.
 */
export function createVinylBoard() {
  const S = 512
  const { canvas, ctx } = surface(S, S)

  ctx.fillStyle = '#a29081'
  ctx.fillRect(0, 0, S, S)
  const boardShade = ctx.createLinearGradient(0, 0, S, S)
  boardShade.addColorStop(0, 'rgba(255,255,255,0.07)')
  boardShade.addColorStop(1, 'rgba(0,0,0,0.12)')
  ctx.fillStyle = boardShade
  ctx.fillRect(0, 0, S, S)

  /* the shadow the record casts onto the board, which does not rotate */
  const pool = ctx.createRadialGradient(S / 2, S / 2 + 6, 120, S / 2, S / 2 + 10, 215)
  pool.addColorStop(0, 'rgba(0,0,0,0.34)')
  pool.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = pool
  ctx.fillRect(0, 0, S, S)

  return finish(canvas)
}

export function createVinylDisc() {
  const S = 1024
  const { canvas, ctx } = surface(S, S)
  const c = S / 2
  const R = 502

  ctx.fillStyle = '#0b0b0d'
  ctx.beginPath()
  ctx.arc(c, c, R, 0, Math.PI * 2)
  ctx.fill()

  /* grooves */
  ctx.save()
  ctx.beginPath()
  ctx.arc(c, c, R, 0, Math.PI * 2)
  ctx.clip()
  for (let r = 210; r < R; r += 3.8) {
    ctx.strokeStyle = `rgba(255,255,255,${r % 30 < 3.8 ? 0.075 : 0.032})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  /*
   * The sheen is the one thing that must NOT turn with the record, or the
   * highlight chases the disc round and it reads as a painted wheel. It
   * lives on the glass in front instead — see createVinylSheen.
   */
  ctx.restore()

  /* label */
  ctx.fillStyle = '#efeae0'
  ctx.beginPath()
  ctx.arc(c, c, 191, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#b9b3a8'
  ctx.fillRect(c - 160, c - 18, 38, 38)
  ctx.fillRect(c + 122, c - 18, 38, 38)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#9a9488'
  ctx.font = '600 27px ui-monospace, Menlo, monospace'
  ctx.fillText('SIDE A', c, c - 92)

  ctx.fillStyle = '#17171a'
  ctx.font = 'italic 600 78px Georgia, "Times New Roman", serif'
  ctx.fillText('Music', c, c - 18)

  ctx.fillStyle = '#6f6a61'
  ctx.font = '400 16px ui-monospace, Menlo, monospace'
  ctx.fillText('played too many times', c, c + 78)
  ctx.fillText('· · · · ·', c, c + 110)
  ctx.fillText('33 ⅓ RPM   ·   PANDA', c, c + 142)

  /* spindle hole, dead centre this time */
  ctx.fillStyle = '#6d6054'
  ctx.beginPath()
  ctx.arc(c, c, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 3
  ctx.stroke()

  return finish(canvas)
}

/* The fixed highlight, laid over the turning disc so it stays put. */
export function createVinylSheen() {
  const S = 512
  const { canvas, ctx } = surface(S, S)
  const c = S / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(c, c, 250, 0, Math.PI * 2)
  ctx.clip()
  const sheen = ctx.createLinearGradient(c - 240, c - 240, c + 190, c + 190)
  sheen.addColorStop(0, 'rgba(255,255,255,0)')
  sheen.addColorStop(0.34, 'rgba(255,255,255,0.13)')
  sheen.addColorStop(0.46, 'rgba(255,255,255,0.02)')
  sheen.addColorStop(0.62, 'rgba(255,255,255,0.10)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, S, S)
  ctx.restore()

  return finish(canvas)
}

/* ----------------------------------- the photo on the wall, for LFC ------ */
/*
 * A high-contrast silhouette, not a likeness — drop a real photo into
 * `public/` and point SECTIONS.liverpool.photo at it to replace this.
 */
export function createPortrait() {
  const W = 768
  const H = 1024
  const { canvas, ctx } = surface(W, H)
  const cx = W / 2

  ctx.fillStyle = '#101012'
  ctx.fillRect(0, 0, W, H)

  /* A blown-out floodlight behind the figure. Silhouettes need something
   * bright to be a silhouette *against* — dark-on-dark just goes muddy. */
  const flood = ctx.createRadialGradient(cx, H * 0.3, 10, cx, H * 0.34, W * 0.68)
  flood.addColorStop(0, 'rgba(255,255,255,0.95)')
  flood.addColorStop(0.3, 'rgba(226,226,232,0.55)')
  flood.addColorStop(0.62, 'rgba(150,150,160,0.16)')
  flood.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = flood
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#0a0a0c'

  /* arms: shoulder to hand, tapered, flung out and up */
  const arm = (dir) => {
    const sx = cx + dir * 86
    const sy = 404
    const hx = cx + dir * 322
    const hy = 286
    ctx.beginPath()
    ctx.moveTo(sx, sy - 26)
    ctx.quadraticCurveTo(cx + dir * 210, 316, hx, hy)
    ctx.lineTo(hx + dir * 26, hy + 16)
    ctx.quadraticCurveTo(cx + dir * 214, 356, sx, sy + 40)
    ctx.closePath()
    ctx.fill()
    /* hand */
    ctx.beginPath()
    ctx.ellipse(hx + dir * 14, hy + 8, 22, 16, dir * -0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  arm(1)
  arm(-1)

  /* torso: broad shoulders tapering to the waist */
  ctx.beginPath()
  ctx.moveTo(cx - 96, 398)
  ctx.quadraticCurveTo(cx - 104, 500, cx - 74, 600)
  ctx.lineTo(cx + 74, 600)
  ctx.quadraticCurveTo(cx + 104, 500, cx + 96, 398)
  ctx.quadraticCurveTo(cx, 372, cx - 96, 398)
  ctx.closePath()
  ctx.fill()

  /* shorts */
  ctx.beginPath()
  ctx.moveTo(cx - 78, 596)
  ctx.lineTo(cx + 78, 596)
  ctx.lineTo(cx + 84, 724)
  ctx.lineTo(cx + 8, 724)
  ctx.lineTo(cx, 676)
  ctx.lineTo(cx - 8, 724)
  ctx.lineTo(cx - 84, 724)
  ctx.closePath()
  ctx.fill()

  /* legs, mid-stride */
  const leg = (dir, splay) => {
    ctx.beginPath()
    ctx.moveTo(cx + dir * 16, 716)
    ctx.lineTo(cx + dir * 78, 716)
    ctx.quadraticCurveTo(cx + dir * (86 + splay), 880, cx + dir * (74 + splay), 1010)
    ctx.lineTo(cx + dir * (26 + splay), 1010)
    ctx.quadraticCurveTo(cx + dir * 30, 870, cx + dir * 16, 716)
    ctx.closePath()
    ctx.fill()
  }
  leg(1, 34)
  leg(-1, 6)

  /* neck and head, chin lifted */
  ctx.fillRect(cx - 22, 356, 44, 54)
  ctx.beginPath()
  ctx.ellipse(cx, 318, 48, 54, 0, 0, Math.PI * 2)
  ctx.fill()

  /* the curls, piled on top rather than worn as a helmet */
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * 1.04 + (i / 19) * Math.PI * 0.92
    const r = 46 + rand(i * 2.3) * 12
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * r, 312 + Math.sin(a) * (r * 0.88), 15 + rand(i) * 12, 0, Math.PI * 2)
    ctx.fill()
  }
  /* beard */
  ctx.beginPath()
  ctx.ellipse(cx, 344, 42, 38, 0, 0, Math.PI)
  ctx.fill()

  /* number on the shirt */
  ctx.fillStyle = 'rgba(214,214,222,0.16)'
  ctx.textAlign = 'center'
  ctx.font = '700 112px Georgia, serif'
  ctx.fillText('11', cx, 540)

  /* film grain */
  const grain = ctx.getImageData(0, 0, W, H)
  const d = grain.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand(i * 0.0007) - 0.5) * 24
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(grain, 0, 0)

  /* vignette */
  const v = ctx.createRadialGradient(cx, H / 2, H * 0.28, cx, H / 2, H * 0.8)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.72)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)

  return finish(canvas)
}

/* ------------------------------------------------- subtle edge highlight - */
/*
 * Sits behind a hovered object and is depth-tested against it, so the object
 * masks the middle and only a thin rim of light survives around the
 * silhouette. Falls off fast — a broad centre-bright glow reads as a halo.
 */
export function createRimGlow() {
  const S = 256
  const { canvas, ctx } = surface(S, S)
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.82)')
  g.addColorStop(0.8, 'rgba(255,255,255,0.4)')
  g.addColorStop(0.93, 'rgba(255,255,255,0.09)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return finish(canvas)
}

/* ------------------------------------------------ the city, separately --- */
/*
 * Drawn for a small plane that sits just behind the window opening, so the
 * wall itself masks it. A large backdrop city cannot work here: the room has
 * no right-hand wall, so anything wide enough to survive orbiting is also
 * wide enough to be seen floating beside the room — which at night, with lit
 * windows, is glaring. Transparent above the rooflines so the sky shows.
 */
export function createSkyline(night) {
  const W = 1024
  const H = 674
  const { canvas, ctx } = surface(W, H)

  const body = night ? '#0b1124' : '#6f89a4'
  let x = -80
  let i = 0
  while (x < W + 80) {
    const w = 62 + rand(i * 3.1) * 104
    const top = 180 + rand(i * 7.7) * 230
    ctx.fillStyle = body
    ctx.fillRect(x, top, w, H - top)

    if (night) {
      for (let wy = top + 18; wy < H - 10; wy += 22) {
        for (let wx = x + 12; wx < x + w - 12; wx += 20) {
          if (rand(wx * 0.7 + wy * 1.3) > 0.68) {
            ctx.fillStyle = rand(wx + wy) > 0.8 ? '#ffd79a' : '#ffbe62'
            ctx.fillRect(wx, wy, 7, 10)
          }
        }
      }
      ctx.fillStyle = body
    }
    x += w + 6 + rand(i * 2.3) * 44
    i++
  }

  /* Wash them back into the air, heaviest low down where the haze sits. */
  const fade = ctx.createLinearGradient(0, 150, 0, H)
  fade.addColorStop(0, 'rgba(0,0,0,0.06)')
  fade.addColorStop(0.5, 'rgba(0,0,0,0.4)')
  fade.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = fade
  ctx.fillRect(0, 150, W, H - 150)

  return finish(canvas)
}

/* ------------------------------------------------- something on the TV --- */
/*
 * Four shots side by side on one strip. The TV shows a 704-wide window of it
 * (RepeatWrapping + repeat.x), drifts slowly across the current shot, then
 * jumps a whole panel to "cut" to the next one.
 *
 * Panels are wider than the window so the drift can never run into the
 * neighbouring shot and show a seam. Animating an offset costs nothing;
 * redrawing a canvas every frame would mean re-uploading megabytes.
 */
export const REEL = { shots: 4, panel: 880, window: 704, height: 384 }
REEL.width = REEL.panel * REEL.shots
REEL.repeat = REEL.window / REEL.width
REEL.step = REEL.panel / REEL.width
REEL.drift = (REEL.panel - REEL.window) / REEL.width

export function createTvReel() {
  const { width: W, height: H, panel: P } = REEL
  const { canvas, ctx } = surface(W, H)

  /* a ridge line, reused at different scales and colours */
  const ridge = (x0, baseY, height, color, seed, step = 18) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x0 - 20, H)
    for (let x = x0 - 20; x <= x0 + P + 20; x += step) {
      const n =
        Math.sin((x + seed * 90) * 0.0042) * 0.55 +
        Math.sin((x + seed * 40) * 0.011) * 0.3 +
        Math.sin((x + seed * 17) * 0.026) * 0.15
      ctx.lineTo(x, baseY - (n * 0.5 + 0.5) * height)
    }
    ctx.lineTo(x0 + P + 20, H)
    ctx.closePath()
    ctx.fill()
  }

  const sky = (x0, stops) => {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    stops.forEach(([o, c]) => g.addColorStop(o, c))
    ctx.fillStyle = g
    ctx.fillRect(x0, 0, P, H)
  }

  const sun = (x, y, r, inner, outer) => {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r)
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  const panel = (i, draw) => {
    const x0 = i * P
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, 0, P, H)
    ctx.clip()
    draw(x0)
    ctx.restore()
  }

  /* 1 — a lake at golden hour */
  panel(0, (x0) => {
    sky(x0, [[0, '#2d4f7c'], [0.5, '#6fa0c4'], [1, '#d6c6a8']])
    sun(x0 + P * 0.68, H * 0.32, 130, 'rgba(255,243,212,0.95)', 'rgba(255,214,150,0)')
    const water = H * 0.7
    ridge(x0, water, 70, '#93abc0', 1)
    ridge(x0, water, 95, '#66809a', 4)
    ridge(x0, water, 120, '#44586f', 9)
    const g = ctx.createLinearGradient(0, water, 0, H)
    g.addColorStop(0, '#41566c')
    g.addColorStop(1, '#1f2c3b')
    ctx.fillStyle = g
    ctx.fillRect(x0, water, P, H - water)
    sun(x0 + P * 0.68, water + 10, 170, 'rgba(255,232,188,0.34)', 'rgba(255,214,150,0)')
  })

  /* 2 — a city at dusk */
  panel(1, (x0) => {
    sky(x0, [[0, '#131c36'], [0.55, '#3d3a5e'], [1, '#c4707a']])
    let x = x0 - 40
    let i = 0
    while (x < x0 + P + 40) {
      const w = 34 + rand(i * 3.7) * 72
      const top = H * 0.32 + rand(i * 7.1) * H * 0.42
      ctx.fillStyle = '#161a2e'
      ctx.fillRect(x, top, w, H - top)
      for (let wy = top + 10; wy < H - 8; wy += 15) {
        for (let wx = x + 6; wx < x + w - 6; wx += 12) {
          if (rand(wx * 0.7 + wy * 1.3) > 0.68) {
            ctx.fillStyle = rand(wx + wy) > 0.8 ? '#ffd79a' : '#ffbe62'
            ctx.fillRect(wx, wy, 4, 6)
          }
        }
      }
      x += w + 5 + rand(i * 2.3) * 26
      i++
    }
  })

  /* 3 — forested ridges in mist */
  panel(2, (x0) => {
    sky(x0, [[0, '#8fb7c4'], [0.6, '#c9d9d2'], [1, '#e4e6da']])
    const tones = ['#9fb6a4', '#7d9b85', '#5c7d68', '#3f5f4d', '#2b4739']
    tones.forEach((c, k) => {
      ridge(x0, H * (0.58 + k * 0.1), 52 + k * 16, c, 3 + k * 5, 14)
      if (k < tones.length - 1) {
        ctx.fillStyle = `rgba(226,234,228,${0.22 - k * 0.03})`
        ctx.fillRect(x0, H * (0.5 + k * 0.1), P, H)
      }
    })
  })

  /* 4 — open sea */
  panel(3, (x0) => {
    sky(x0, [[0, '#1d3a63'], [0.55, '#7ea9c9'], [1, '#e8d2b4']])
    sun(x0 + P * 0.38, H * 0.5, 96, 'rgba(255,238,198,0.98)', 'rgba(255,206,140,0)')
    for (let k = 0; k < 7; k++) {
      const cy = H * (0.16 + rand(k * 5.3) * 0.22)
      const cw = 90 + rand(k * 2.7) * 190
      ctx.fillStyle = `rgba(255,236,214,${0.16 + rand(k) * 0.16})`
      ctx.beginPath()
      ctx.ellipse(x0 + rand(k * 9.1) * P, cy, cw, 11 + rand(k * 3) * 9, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    const sea = H * 0.62
    const g = ctx.createLinearGradient(0, sea, 0, H)
    g.addColorStop(0, '#4d7695')
    g.addColorStop(1, '#22384d')
    ctx.fillStyle = g
    ctx.fillRect(x0, sea, P, H - sea)
    for (let k = 0; k < 40; k++) {
      const y = sea + 6 + rand(k * 3.1) * (H - sea - 8)
      const w = 24 + rand(k * 5.7) * 110
      ctx.fillStyle = `rgba(255,240,214,${0.05 + rand(k) * 0.08})`
      ctx.fillRect(x0 + rand(k * 7.7) * P - w / 2, y, w, 2)
    }
  })

  /* scanlines, so it reads as a screen rather than a window */
  ctx.fillStyle = 'rgba(0,0,0,0.09)'
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)

  return finish(canvas)
}

/* -------------------------------------------- small prints for the wall -- */
export function createPhotoPrint(seed) {
  const W = 256
  const H = 192
  const { canvas, ctx } = surface(W, H)

  const palettes = [
    ['#8fb6d6', '#dcc8a4', '#3f5468'],
    ['#e2b48c', '#f0dcc0', '#7c5340'],
    ['#a8c49a', '#e3ecd8', '#40583c'],
    ['#c9a8c4', '#eadff0', '#4a3a58'],
    ['#9fb8c8', '#e6eef2', '#2f4658'],
    ['#e0a894', '#f4e2d4', '#6b3a34'],
  ]
  const [top, low, dark] = palettes[seed % palettes.length]

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, top)
  g.addColorStop(0.62, low)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  /* a horizon and a simple subject, enough to read as a photo at 4cm */
  const horizon = H * (0.56 + rand(seed) * 0.16)
  ctx.fillStyle = dark
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.moveTo(0, H)
  ctx.lineTo(0, horizon)
  for (let x = 0; x <= W; x += 16) {
    ctx.lineTo(x, horizon - Math.sin((x + seed * 40) * 0.02) * 12 - rand(x + seed) * 8)
  }
  ctx.lineTo(W, H)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  if (seed % 3 === 0) {
    /* a lone figure */
    ctx.fillStyle = 'rgba(20,22,28,0.8)'
    ctx.fillRect(W * 0.46, horizon - 30, 8, 30)
    ctx.beginPath()
    ctx.arc(W * 0.46 + 4, horizon - 35, 5, 0, Math.PI * 2)
    ctx.fill()
  } else if (seed % 3 === 1) {
    /* sun low over the ridge */
    const s = ctx.createRadialGradient(W * 0.68, horizon - 22, 2, W * 0.68, horizon - 22, 46)
    s.addColorStop(0, 'rgba(255,244,214,0.95)')
    s.addColorStop(1, 'rgba(255,230,180,0)')
    ctx.fillStyle = s
    ctx.fillRect(0, 0, W, H)
  }

  return finish(canvas)
}

/* ------------------------------------------------ a lamp's beam fade ---- */
/*
 * Mapped onto the cone of light under a lampshade. ConeGeometry runs v=0 at
 * the base rim to v=1 at the apex, and CanvasTexture flips Y, so the top of
 * this canvas is the apex: opaque at the shade, gone by the desk.
 */
export function createBeamFade() {
  const W = 8
  const H = 128
  const { canvas, ctx } = surface(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.82, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  return finish(canvas)
}

/* ------------------------------------------------------------- rug ----- */
/*
 * Three stacked planes read as coloured paper. A rug needs a weave, a border
 * that steps in, and fringe at the ends — all of which are cheaper drawn
 * than modelled.
 */
export function createRug() {
  const W = 1024
  const H = 744
  const { canvas, ctx } = surface(W, H)

  const NAVY_DEEP = '#333d54'
  const NAVY = '#46567a'
  const CREAM = '#e6ddcb'

  const inset = (fx, fy, fill) => {
    const x = W * fx
    const y = H * fy
    ctx.fillStyle = fill
    ctx.fillRect(x, y, W - x * 2, H - y * 2)
  }

  inset(0, 0, NAVY_DEEP)
  inset(0.035, 0.048, NAVY)
  inset(0.1, 0.138, '#3c4a6a')
  inset(0.112, 0.154, NAVY)
  inset(0.225, 0.262, CREAM)
  inset(0.245, 0.29, '#efe8da')

  /* a running key pattern in the border */
  ctx.strokeStyle = 'rgba(214,204,182,0.34)'
  ctx.lineWidth = 3
  for (let x = W * 0.055; x < W * 0.945; x += 40) {
    ctx.strokeRect(x, H * 0.075, 22, H * 0.042)
    ctx.strokeRect(x, H * 0.883, 22, H * 0.042)
  }
  for (let y = H * 0.09; y < H * 0.91; y += 40) {
    ctx.strokeRect(W * 0.052, y, W * 0.016, 22)
    ctx.strokeRect(W * 0.932, y, W * 0.016, 22)
  }

  /* weave: fine threads both ways, plus a little unevenness */
  ctx.globalAlpha = 0.07
  ctx.fillStyle = '#000'
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)
  ctx.fillStyle = '#fff'
  for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H)
  ctx.globalAlpha = 1

  for (let i = 0; i < 260; i++) {
    const x = rand(i * 1.7) * W
    const y = rand(i * 3.3) * H
    ctx.fillStyle = `rgba(0,0,0,${0.02 + rand(i) * 0.04})`
    ctx.fillRect(x, y, 30 + rand(i * 5) * 90, 3 + rand(i * 7) * 5)
  }

  /* fringe along the short ends */
  ctx.strokeStyle = 'rgba(226,216,196,0.85)'
  ctx.lineWidth = 2.4
  for (let y = 6; y < H - 6; y += 7) {
    const w = 10 + rand(y) * 8
    ctx.beginPath()
    ctx.moveTo(1, y)
    ctx.lineTo(1 + w, y + (rand(y * 2) - 0.5) * 3)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(W - 1, y)
    ctx.lineTo(W - 1 - w, y + (rand(y * 3) - 0.5) * 3)
    ctx.stroke()
  }

  return finish(canvas)
}
