/* Every focus point has to survive OrbitControls' clamps, or the camera gets
   yanked somewhere else the moment the flight lands. This checks them all. */
import { FOCUS } from '../src/scene/focus.js'
import { HOME } from '../src/room.js'

const LIMITS = {
  minDistance: 1.2,
  maxDistance: 22,
  minPolarAngle: 0.25,
  maxPolarAngle: 1.47,
  minAzimuthAngle: -0.45,
  maxAzimuthAngle: 1.62,
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const len = (v) => Math.hypot(...v)

let bad = 0
for (const [name, f] of Object.entries({ HOME, ...FOCUS })) {
  const target = [...f.target]
  if (f.shift) {
    const d = sub(f.target, f.pos)
    /* screen-right = cross(viewDir, up) */
    const r = [-d[2], 0, d[0]]
    const rl = len(r)
    target[0] += (r[0] / rl) * f.shift
    target[2] += (r[2] / rl) * f.shift
  }

  const o = sub(f.pos, target)
  const horiz = Math.hypot(o[0], o[2])
  const dist = len(o)
  const azimuth = Math.atan2(o[0], o[2])
  const polar = Math.atan2(horiz, o[1])

  const problems = []
  if (dist < LIMITS.minDistance) problems.push(`distance ${dist.toFixed(2)} < ${LIMITS.minDistance}`)
  if (dist > LIMITS.maxDistance) problems.push(`distance ${dist.toFixed(2)} > ${LIMITS.maxDistance}`)
  if (polar < LIMITS.minPolarAngle) problems.push(`polar ${polar.toFixed(3)} < ${LIMITS.minPolarAngle}`)
  if (polar > LIMITS.maxPolarAngle) problems.push(`polar ${polar.toFixed(3)} > ${LIMITS.maxPolarAngle}`)
  if (azimuth < LIMITS.minAzimuthAngle) problems.push(`azimuth ${azimuth.toFixed(3)} < ${LIMITS.minAzimuthAngle}`)
  if (azimuth > LIMITS.maxAzimuthAngle) problems.push(`azimuth ${azimuth.toFixed(3)} > ${LIMITS.maxAzimuthAngle}`)

  const tag = problems.length ? 'CLAMPED' : 'ok     '
  if (problems.length) bad++
  console.log(
    `${tag} ${name.padEnd(10)} dist ${dist.toFixed(2).padStart(5)}  azim ${azimuth.toFixed(3).padStart(6)}  polar ${polar.toFixed(3)}` +
      (problems.length ? `\n         → ${problems.join('; ')}` : '')
  )
}
process.exit(bad ? 1 : 0)
