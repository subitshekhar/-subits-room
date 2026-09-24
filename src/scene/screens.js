import { CanvasTexture, SRGBColorSpace, LinearFilter } from 'three'

/* ---------------------------------------------------------------------------
 * Canvas-drawn textures for the laptop. Drawing the screen rather than
 * faking it with a flat colour is what makes the laptop worth clicking —
 * you can read SUBIT_OS on it before you ever open the panel.
 * ------------------------------------------------------------------------- */

const C = {
  bg: '#0a111c',
  bar: '#141d2c',
  barText: '#54718a',
  prompt: '#6ee7a8',
  cyan: '#7fe0ff',
  text: '#cfe6f2',
  dim: '#5b7a90',
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

function newTexture(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.anisotropy = 4
  return { canvas, ctx: canvas.getContext('2d'), tex }
}

/* --------------------------------------------------- the laptop screen --- */
const SCREEN_W = 640
const SCREEN_H = 400

/* What's on the screen when you're just looking at the room. */
const IDLE = [
  ['$ ', 'whoami'],
  ['', 'subit — engineer'],
  ['', ''],
  ['$ ', 'ls ~'],
  ['', 'work/   projects/   experiments/   ideas/'],
  ['', ''],
]

const HOVER = [
  ['$ ', 'whoami'],
  ['', 'subit — engineer'],
  ['', ''],
  ['$ ', 'ls ~'],
  ['', 'work/   projects/   experiments/   ideas/'],
  ['', ''],
  ['> ', 'click to open'],
]

export function createScreen() {
  const { canvas, ctx, tex } = newTexture(SCREEN_W, SCREEN_H)

  function draw(mode = 'idle', caretOn = true) {
    const lines = mode === 'idle' ? IDLE : HOVER

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

    /* window chrome */
    ctx.fillStyle = C.bar
    ctx.fillRect(0, 0, SCREEN_W, 38)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(26 + i * 22, 19, 6.5, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = C.barText
    ctx.font = '500 15px ui-monospace, Menlo, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('subit@room — zsh', SCREEN_W / 2, 24)
    ctx.textAlign = 'left'

    /* title */
    ctx.fillStyle = C.cyan
    ctx.font = '500 20px ui-monospace, Menlo, monospace'
    ctx.fillText('SUBIT_OS', 24, 76)
    ctx.fillStyle = C.dim
    ctx.font = '400 15px ui-monospace, Menlo, monospace'
    ctx.fillText('v0.1', 132, 76)

    /* body */
    const x = 24
    let y = 116
    ctx.font = '400 17px ui-monospace, Menlo, monospace'
    lines.forEach(([pre, body]) => {
      let cx = x
      if (pre) {
        ctx.fillStyle = pre === '> ' ? C.cyan : C.prompt
        ctx.fillText(pre, cx, y)
        cx += ctx.measureText(pre).width
      }
      ctx.fillStyle = pre ? C.text : C.dim
      ctx.fillText(body, cx, y)
      y += 30
    })

    /* the caret on its own final line */
    ctx.fillStyle = C.prompt
    ctx.fillText('$ ', x, y)
    if (caretOn) {
      ctx.fillStyle = C.cyan
      ctx.fillRect(x + ctx.measureText('$ ').width, y - 14, 11, 19)
    }

    /* scanlines + a soft vignette so it reads as a lit panel, not a sticker */
    ctx.fillStyle = 'rgba(0,0,0,0.13)'
    for (let sy = 0; sy < SCREEN_H; sy += 3) ctx.fillRect(0, sy, SCREEN_W, 1)

    const g = ctx.createRadialGradient(
      SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.25,
      SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.8
    )
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.42)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

    tex.needsUpdate = true
  }

  draw('idle', true)
  return { tex, draw, canvas }
}

/* ------------------------------------------------- the keyboard deck ----- */
export function createDeck() {
  const W = 620
  const H = 430
  const { ctx, tex } = newTexture(W, H)

  ctx.fillStyle = '#343a43'
  ctx.fillRect(0, 0, W, H)

  /* recessed keyboard well */
  ctx.fillStyle = '#262b33'
  roundRect(ctx, 26, 20, W - 52, 228, 10)
  ctx.fill()

  const padX = 34
  const usable = W - padX * 2
  const gap = 4

  /* One key, with a highlight along its top edge so it catches the light. */
  const key = (x, y, w, h) => {
    ctx.fillStyle = '#14171d'
    roundRect(ctx, x, y, w, h, 4)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    roundRect(ctx, x, y, w, h * 0.45, 4)
    ctx.fill()
  }

  /* An even row of `n` keys. */
  const row = (n, y, h) => {
    const kw = (usable - gap * (n - 1)) / n
    for (let i = 0; i < n; i++) key(padX + i * (kw + gap), y, kw, h)
  }

  /* A row of keys with uneven widths, given as relative units. */
  const unevenRow = (units, y, h) => {
    const total = units.reduce((a, b) => a + b, 0)
    const unit = (usable - gap * (units.length - 1)) / total
    let x = padX
    units.forEach((u) => {
      key(x, y, unit * u, h)
      x += unit * u + gap
    })
  }

  row(14, 28, 20)      /* function row */
  row(14, 54, 34)
  row(13, 92, 34)
  row(12, 130, 34)
  row(11, 168, 34)
  unevenRow([1.3, 1, 1, 6.2, 1, 1, 1.3], 206, 34) /* modifiers and the space bar */

  /* trackpad */
  ctx.fillStyle = '#434a55'
  roundRect(ctx, W / 2 - 106, 266, 212, 126, 9)
  ctx.fill()
  ctx.fillStyle = '#3a414b'
  roundRect(ctx, W / 2 - 103, 269, 206, 120, 8)
  ctx.fill()

  tex.needsUpdate = true
  return tex
}
