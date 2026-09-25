/* ---------------------------------------------------------------------------
 *  The thing the television does when nobody has touched anything for a
 *  while: a logo bounces around it, and if it ever hits a corner exactly,
 *  the screen throws confetti.
 *
 *  A true corner hit in a rectangular billiard needs the horizontal and
 *  vertical periods to line up, which for arbitrary starting conditions can
 *  take hours or never happen at all. A payoff nobody sees is wasted work,
 *  so after enough honest bounces this nudges the next trajectory onto a
 *  corner. Everything up to that point is real physics.
 * ------------------------------------------------------------------------- */

import { CanvasTexture, LinearFilter, SRGBColorSpace, ClampToEdgeWrapping } from 'three'

const W = 640
const H = 360
const LOGO_W = 132
const LOGO_H = 62
const SPEED = 104 /* px per second, the lazy drift of the real thing */

/* how many ordinary bounces before the next one is aimed at a corner */
const BOUNCES_BEFORE_RIGGING = 7

const PALETTE = ['#ff5f7a', '#ffd166', '#6ee7b7', '#7fd8ff', '#c4b5fd', '#fb923c']
const CONFETTI_SECONDS = 2.8

export function createScreensaver() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.wrapS = ClampToEdgeWrapping
  tex.wrapT = ClampToEdgeWrapping

  const maxX = W - LOGO_W
  const maxY = H - LOGO_H

  const s = {
    x: 90,
    y: 70,
    vx: SPEED,
    vy: SPEED * 0.62,
    colour: 0,
    bounces: 0,
    rigged: false,
    /* seconds left of the celebration; 0 means it is just bouncing */
    party: 0,
    confetti: [],
    flash: 0,
    hits: 0,
  }

  /*
   * Aim the next leg at whichever corner lies ahead. Both axes are already
   * travelling at constant speed, so matching the time-to-wall on each is
   * just a matter of scaling one of them.
   */
  function rig() {
    const tx = (s.vx > 0 ? maxX - s.x : s.x) / Math.abs(s.vx)
    const ty = (s.vy > 0 ? maxY - s.y : s.y) / Math.abs(s.vy)
    if (tx <= 0 || ty <= 0) return
    /* slow the axis that would arrive first so they land together */
    if (tx > ty) s.vy *= ty / tx
    else s.vx *= tx / ty
    s.rigged = true
  }

  function burst() {
    s.hits += 1
    s.party = CONFETTI_SECONDS
    s.flash = 1
    s.confetti = []
    for (let i = 0; i < 150; i++) {
      s.confetti.push({
        x: s.x + LOGO_W / 2,
        y: s.y + LOGO_H / 2,
        vx: (Math.random() - 0.5) * 660,
        vy: (Math.random() - 0.5) * 660 - 120,
        w: 4 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 14,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
      })
    }
    /* reset the speeds it lost while being aimed, and go again */
    const mag = Math.hypot(s.vx, s.vy) || SPEED
    s.vx = (s.vx / mag) * SPEED
    s.vy = (s.vy / mag) * SPEED * 0.62
    s.bounces = 0
    s.rigged = false
    s.colour = (s.colour + 1) % PALETTE.length
  }

  function move(dt) {
    s.x += s.vx * dt
    s.y += s.vy * dt

    let hitX = false
    let hitY = false
    if (s.x <= 0) {
      s.x = 0
      s.vx = Math.abs(s.vx)
      hitX = true
    } else if (s.x >= maxX) {
      s.x = maxX
      s.vx = -Math.abs(s.vx)
      hitX = true
    }
    if (s.y <= 0) {
      s.y = 0
      s.vy = Math.abs(s.vy)
      hitY = true
    } else if (s.y >= maxY) {
      s.y = maxY
      s.vy = -Math.abs(s.vy)
      hitY = true
    }

    if (hitX && hitY) return burst()

    if (hitX || hitY) {
      s.bounces += 1
      s.colour = (s.colour + 1) % PALETTE.length
      if (!s.rigged && s.bounces >= BOUNCES_BEFORE_RIGGING) rig()
    }
  }

  function drawLogo() {
    const cx = s.x + LOGO_W / 2
    const cy = s.y + LOGO_H / 2
    const c = PALETTE[s.colour]

    ctx.save()
    ctx.translate(cx, cy)
    ctx.fillStyle = c
    ctx.shadowColor = c
    ctx.shadowBlur = 22

    /* the wordmark, squashed the way the original is */
    ctx.font = 'italic 900 44px Georgia, "Times New Roman", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.scale(1.28, 1)
    ctx.fillText('DVD', 0, -5)
    ctx.restore()

    /* the ellipse underneath it */
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.ellipse(0, 20, 54, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.font = '700 11px ui-monospace, Menlo, monospace'
    ctx.fillText('VIDEO', 0, 21)
    ctx.restore()
  }

  function drawConfetti(dt) {
    for (const p of s.confetti) {
      p.vy += 620 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
      p.vx *= 0.995
    }
    const fade = Math.min(1, s.party / 0.8)
    ctx.save()
    ctx.globalAlpha = fade
    for (const p of s.confetti) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    ctx.restore()
  }

  return {
    tex,
    /* 0 when idle, rising to 1 on a corner hit — the room reads this to
     * flare the light the screen throws on the wall */
    get flash() {
      return s.flash
    },
    get hits() {
      return s.hits
    },

    tick(dt) {
      const step = Math.min(dt, 1 / 30)

      if (s.party > 0) s.party = Math.max(0, s.party - step)
      else move(step)

      s.flash = Math.max(0, s.flash - step * 1.6)

      ctx.fillStyle = '#05070c'
      ctx.fillRect(0, 0, W, H)

      if (s.party <= 0) drawLogo()
      else {
        /* the logo sits in the corner it earned while the confetti falls */
        drawLogo()
        drawConfetti(step)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = '700 15px ui-monospace, Menlo, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PERFECT CORNER', W / 2, H - 34)
      }

      if (s.flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.75})`
        ctx.fillRect(0, 0, W, H)
      }

      tex.needsUpdate = true
    },

    dispose() {
      tex.dispose()
    },
  }
}
