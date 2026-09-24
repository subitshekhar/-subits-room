import { useMemo } from 'react'

/* ---------------------------------------------------------------------------
 * Out-of-focus leaves around the edges of the page, as if the room were shot
 * past a plant on the windowsill. Three layers at different blurs: a soft
 * shadow cast on the background, a distant layer, and a nearer one.
 *
 * Drawn rather than an image so it retints for night and costs nothing to
 * load. Purely decorative — it never takes pointer events.
 * ------------------------------------------------------------------------- */

const rnd = (s) => {
  const x = Math.sin(s * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/* A pointed lens shape, which reads as a leaf where an ellipse reads as a blob. */
const leafPath = (len, wide) =>
  `M ${-len / 2} 0 Q 0 ${-wide / 2} ${len / 2} 0 Q 0 ${wide / 2} ${-len / 2} 0 Z`

/*
 * Leaves strung along a curved stem, scattered off it. `sweep` bends the
 * stem; `drift` is how far leaves wander from it.
 */
function branch({ seed, x0, y0, x1, y1, sweep, count, size, drift }) {
  const stem = []
  const leaves = []

  for (let i = 0; i <= count; i++) {
    const t = i / count
    /* quadratic through a control point offset perpendicular to the run */
    const mx = (x0 + x1) / 2 + sweep
    const my = (y0 + y1) / 2 - sweep * 0.6
    const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1
    const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1
    stem.push([px, py])

    if (i === 0) continue
    const side = i % 2 === 0 ? 1 : -1
    const len = size * (0.62 + rnd(seed + i * 3.1) * 0.7)
    leaves.push({
      x: px + side * drift * (0.4 + rnd(seed + i) * 0.9),
      y: py + (rnd(seed + i * 7.3) - 0.5) * drift * 1.1,
      len,
      wide: len * (0.36 + rnd(seed + i * 11.7) * 0.22),
      rot: side * (18 + rnd(seed + i * 5.9) * 62) + (rnd(seed + i) - 0.5) * 40,
    })
  }

  return { stem: stem.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' '), leaves }
}

function Cluster({ branches, stroke }) {
  return (
    <>
      {branches.map((b, i) => (
        <g key={i}>
          <path d={b.stem} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          {b.leaves.map((l, j) => (
            <path
              key={j}
              d={leafPath(l.len, l.wide)}
              transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}
            />
          ))}
        </g>
      ))}
    </>
  )
}

export default function Foliage({ night }) {
  /* Each corner gets its own set. Coordinates are in the SVG's own box, which
   * is anchored past the edge of the page so the stems run off-screen. */
  const sets = useMemo(
    () => ({
      topLeft: [
        branch({ seed: 1, x0: -60, y0: 60, x1: 560, y1: 340, sweep: 150, count: 12, size: 128, drift: 60 }),
        branch({ seed: 9, x0: 40, y0: -40, x1: 330, y1: 440, sweep: -120, count: 10, size: 104, drift: 52 }),
        branch({ seed: 17, x0: -80, y0: 240, x1: 400, y1: 80, sweep: 80, count: 9, size: 88, drift: 44 }),
      ],
      midLeft: [
        branch({ seed: 61, x0: -70, y0: 40, x1: 280, y1: 470, sweep: 95, count: 9, size: 94, drift: 46 }),
      ],
      bottomLeft: [
        branch({ seed: 23, x0: -40, y0: 540, x1: 500, y1: 220, sweep: -130, count: 11, size: 116, drift: 56 }),
        branch({ seed: 31, x0: 80, y0: 600, x1: 320, y1: 160, sweep: 100, count: 9, size: 92, drift: 46 }),
      ],
      right: [
        branch({ seed: 41, x0: 460, y0: -30, x1: 140, y1: 400, sweep: 110, count: 10, size: 106, drift: 52 }),
        branch({ seed: 53, x0: 480, y0: 450, x1: 170, y1: 780, sweep: -90, count: 9, size: 90, drift: 44 }),
      ],
    }),
    []
  )

  const stroke = night ? '#0d1a12' : '#2f4a2a'

  const panel = (name, w, h, branches) => (
    <svg className={`f-${name}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor">
      <Cluster branches={branches} stroke={stroke} />
    </svg>
  )

  return (
    <div className={`foliage ${night ? 'is-dark' : ''}`} aria-hidden="true">
      <div className="f-layer f-shadow">
        {panel('tl', 820, 680, sets.topLeft)}
        {panel('ml', 420, 520, sets.midLeft)}
        {panel('bl', 700, 640, sets.bottomLeft)}
        {panel('r', 520, 820, sets.right)}
      </div>
      <div className="f-layer f-far">
        {panel('tl', 820, 680, sets.topLeft)}
        {panel('ml', 420, 520, sets.midLeft)}
        {panel('bl', 700, 640, sets.bottomLeft)}
        {panel('r', 520, 820, sets.right)}
      </div>
      <div className="f-layer f-near">
        {panel('tl', 820, 680, sets.topLeft)}
        {panel('bl', 700, 640, sets.bottomLeft)}
      </div>
    </div>
  )
}
