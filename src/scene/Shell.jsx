import { useEffect, useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { Euler, Quaternion, Vector3 } from 'three'
import { P, MOODS } from './palette.js'
import { ROOM } from '../room.js'
import {
  createBeam,
  createRoomShade,
  createRug,
  createShadowBlob,
  createSky,
  createSkyline,
  createSunPatch,
} from './textures.js'
import GroundBlob from './GroundBlob.jsx'

const W = ROOM.window

/* ---------------------------------------------------------------- floor -- */
function Floor() {
  const planks = useMemo(() => {
    const n = 15
    const depth = ROOM.d / n
    return Array.from({ length: n }, (_, i) => ({
      z: -ROOM.d / 2 + depth / 2 + i * depth,
      depth: depth - 0.012,
      color: [P.floor, P.floorAlt, P.floorDark][i % 3],
    }))
  }, [])

  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={[0, -0.04, p.z]} receiveShadow>
          <boxGeometry args={[ROOM.w, 0.08, p.depth]} />
          <meshStandardMaterial color={p.color} roughness={0.72} />
        </mesh>
      ))}
    </group>
  )
}

/* ----------------------------------------------------------------- AO ---- */
/*
 * Soft shadow gathering where surfaces meet. Baked into gradient sheets
 * rather than computed, which costs nothing and — unlike screen-space AO —
 * can't shimmer when the camera moves.
 */
function Occlusion() {
  const floorShade = useMemo(() => createRoomShade({ edges: ['top', 'left'], strength: 0.52 }), [])
  const backCorner = useMemo(() => createRoomShade({ edges: ['left'], strength: 0.4 }), [])
  const leftCorner = useMemo(() => createRoomShade({ edges: ['right'], strength: 0.4 }), [])
  const skirtBack = useMemo(() => createRoomShade({ edges: ['bottom'], strength: 0.34 }), [])
  const skirtLeft = useMemo(() => createRoomShade({ edges: ['bottom'], strength: 0.34 }), [])

  const sheet = (map) => (
    <meshBasicMaterial map={map} transparent depthWrite={false} opacity={1} />
  )

  return (
    <group>
      {/* the floor, dark where it meets both walls */}
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        {sheet(floorShade)}
      </mesh>

      {/* the vertical corner where the two walls meet — kept clear of the window */}
      <mesh position={[-3.3, 1.7, -4.48]} renderOrder={1}>
        <planeGeometry args={[2.4, ROOM.h]} />
        {sheet(backCorner)}
      </mesh>
      <mesh position={[-4.48, 1.7, -3.3]} rotation={[0, Math.PI / 2, 0]} renderOrder={1}>
        <planeGeometry args={[2.4, ROOM.h]} />
        {sheet(leftCorner)}
      </mesh>

      {/* where each wall meets the floor (below the window line, so no overlap) */}
      <mesh position={[0, 0.5, -4.475]} renderOrder={1}>
        <planeGeometry args={[ROOM.w, 1.0]} />
        {sheet(skirtBack)}
      </mesh>
      <mesh position={[-4.475, 0.5, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={1}>
        <planeGeometry args={[ROOM.d, 1.0]} />
        {sheet(skirtLeft)}
      </mesh>
    </group>
  )
}

/* --------------------------------------------------------------- walls --- */
function Wall({ args, position, color = P.wall }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  )
}

function Walls() {
  const t = 0.2
  const h = ROOM.h
  const leftW = W.x0 + ROOM.w / 2
  const rightW = ROOM.w / 2 - W.x1

  return (
    <group>
      <Wall args={[leftW, h, t]} position={[-ROOM.w / 2 + leftW / 2, h / 2, ROOM.wallZ]} />
      <Wall args={[rightW, h, t]} position={[ROOM.w / 2 - rightW / 2, h / 2, ROOM.wallZ]} />
      <Wall args={[W.x1 - W.x0, W.y0, t]} position={[(W.x0 + W.x1) / 2, W.y0 / 2, ROOM.wallZ]} />
      <Wall args={[W.x1 - W.x0, h - W.y1, t]} position={[(W.x0 + W.x1) / 2, (h + W.y1) / 2, ROOM.wallZ]} />
      <Wall args={[t, h, ROOM.d]} position={[ROOM.wallX, h / 2, 0]} color={P.wallShade} />

      <mesh position={[0, 0.09, ROOM.wallZ + t / 2 + 0.03]} receiveShadow>
        <boxGeometry args={[ROOM.w, 0.18, 0.06]} />
        <meshStandardMaterial color={P.trim} roughness={0.6} />
      </mesh>
      <mesh position={[ROOM.wallX + t / 2 + 0.03, 0.09, 0]} receiveShadow>
        <boxGeometry args={[0.06, 0.18, ROOM.d]} />
        <meshStandardMaterial color={P.trim} roughness={0.6} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------- window --- */
function WindowUnit({ night }) {
  const w = W.x1 - W.x0
  const h = W.y1 - W.y0
  const cx = (W.x0 + W.x1) / 2
  const cy = (W.y0 + W.y1) / 2
  const f = 0.07

  const bar = (args, position) => (
    <mesh position={position} castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={P.trim} roughness={0.5} />
    </mesh>
  )

  return (
    <group position={[0, 0, ROOM.wallZ + 0.02]}>
      {bar([w + f * 2, f, 0.22], [cx, W.y1 + f / 2, 0])}
      {bar([w + f * 2, f, 0.22], [cx, W.y0 - f / 2, 0])}
      {bar([f, h, 0.22], [W.x0 - f / 2, cy, 0])}
      {bar([f, h, 0.22], [W.x1 + f / 2, cy, 0])}
      {bar([f * 0.6, h, 0.16], [cx, cy, 0])}
      {bar([w, f * 0.6, 0.16], [cx, cy, 0])}

      <mesh position={[cx, cy, -0.02]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={night ? '#0e1630' : '#bcdcf2'}
          transparent
          opacity={0.08}
          roughness={0.05}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[cx, W.y0 - f, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.34, 0.08, 0.36]} />
        <meshStandardMaterial color={P.trim} roughness={0.6} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------- the world outside ----- */
/* One hazed plane. No geometry out there to compete with the room. */
function Backdrop({ night }) {
  const sky = useMemo(() => createSky(night), [night])
  const skyline = useMemo(() => createSkyline(night), [night])
  /* both are rebuilt on every dusk — let the old ones go */
  useEffect(() => () => {
    sky.dispose()
    skyline.dispose()
  }, [sky, skyline])
  /*
   * Kept close. At z=-24 the backdrop sat ~40 units from the camera, which
   * fog alone washed 56% toward the fog colour before the haze in the
   * texture even applied — the window came out a flat white rectangle.
   * The plane stays large so it still covers the sky above the walls.
   */
  return (
    <group>
      <mesh position={[0, -2.13, -13]}>
        <planeGeometry args={[100, 46]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      {/* The city sits just behind the window opening, so the wall masks it
        * from every angle. Look in obliquely enough to miss its edges and you
        * simply see the sky plane behind, which is seamless. */}
      <mesh position={[(W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, ROOM.wallZ - 0.32]}>
        <planeGeometry args={[3.5, 2.3]} />
        <meshBasicMaterial map={skyline} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------- the shaft of sunlight ---- */
/*
 * Aimed along the actual sun direction rather than eyeballed, so the pool on
 * the floor lands where the window would really put it. Two crossed quads
 * with feathered edges read as a volume from any angle; a single hard quad
 * reads as a sheet of plastic, which is what it looked like before.
 */
function SunBeam({ intensity }) {
  const beam = useMemo(() => createBeam(), [])
  const patch = useMemo(() => createSunPatch(), [])

  const sun = MOODS.day.sun.position
  const dir = useMemo(() => new Vector3(-sun[0], -sun[1], -sun[2]).normalize(), [sun])

  /* where the shaft lands, solved rather than guessed */
  const cx = (W.x0 + W.x1) / 2
  const cy = (W.y0 + W.y1) / 2
  const travel = cy / -dir.y
  const land = [cx + dir.x * travel, 0, ROOM.wallZ + dir.z * travel]

  /* orient local +y back up the shaft toward the glass */
  const rot = useMemo(
    () => new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().negate())),
    [dir]
  )

  if (intensity <= 0) return null
  const w = (W.x1 - W.x0) * 1.05

  return (
    <group>
      <group position={[cx, cy, ROOM.wallZ]} rotation={rot}>
        {[0, Math.PI / 2].map((yaw) => (
          <mesh key={yaw} rotation={[0, yaw, 0]} position={[0, -travel / 2, 0]} renderOrder={3}>
            <planeGeometry args={[w, travel * 1.08]} />
            <meshBasicMaterial map={beam} transparent opacity={intensity} depthWrite={false} />
          </mesh>
        ))}
        <Sparkles count={46} scale={[w, travel, w * 0.6]} position={[0, -travel / 2, 0]} size={1.5} speed={0.2} color="#fff0cf" />
      </group>

      <mesh position={[land[0], 0.016, land[2]]} rotation={[-Math.PI / 2, 0, 0.3]} renderOrder={3}>
        <planeGeometry args={[3.4, 2.8]} />
        <meshBasicMaterial map={patch} transparent opacity={intensity * 2.2} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ----------------------------------------------------------------- rug --- */
function Rug() {
  const map = useMemo(() => createRug(), [])
  useEffect(() => () => map.dispose(), [map])

  return (
    <group>
      <GroundBlob position={[0.7, 0.9]} scale={[6.2, 5.0]} opacity={0.34} />
      <group position={[0.7, 0, 0.9]} rotation={[0, 0.12, 0]}>
        {/* a little thickness, so it has an edge to catch light */}
        <mesh position={[0, 0.014, 0]} receiveShadow>
          <boxGeometry args={[4.4, 0.022, 3.2]} />
          <meshStandardMaterial color="#333d54" roughness={1} />
        </mesh>
        <mesh position={[0, 0.0262, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.4, 3.2]} />
          <meshStandardMaterial map={map} roughness={0.98} />
        </mesh>
      </group>
    </group>
  )
}

/* The room is a slab floating in fog; this sits it on something. */
function SlabShadow() {
  const map = useMemo(() => createShadowBlob(0.5), [])
  return (
    <mesh position={[0, -0.6, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} opacity={0.55} />
    </mesh>
  )
}

export default function Shell({ night }) {
  const mood = night ? MOODS.night : MOODS.day
  return (
    <group>
      <Floor />
      <Walls />
      <Occlusion />
      <WindowUnit night={night} />
      <Backdrop night={night} />
      <SunBeam intensity={mood.beam} />
      <Rug />
      <SlabShadow />
    </group>
  )
}
