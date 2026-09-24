import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Billboard, Html, RoundedBox } from '@react-three/drei'
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Object3D,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three'
import { P } from './palette.js'
import Hotspot from './Hotspot.jsx'
import GroundBlob from './GroundBlob.jsx'
import { DECOR, NO_HIT } from './decor.js'
import { createBeamFade, createGlow } from './textures.js'
import { useRoom } from '../roomContext.jsx'
import { FOCUS } from './focus.js'
import { createDeck, createScreen } from './screens.js'
import {
  createPhotoPrint,
  createPortrait,
  createScribbleNote,
  REEL,
  createSteam,
  createTvReel,
  createVinylArt,
} from './textures.js'
import { SECTIONS } from '../content.js'

/* Small helper so the geometry below stays readable. */
function B({ args, position, rotation, color, rough = 0.8, metal = 0, emissive = '#000000', ei = 0, cast = true }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} emissive={emissive} emissiveIntensity={ei} />
    </mesh>
  )
}

function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/*
 * Desk-area tones. The floor, bookshelf and desk were all the same orange-tan
 * and the corner read as one mass; the desk is pale ash now, with a navy mat
 * echoing the rug and the bed.
 */
const ASH = '#cec4b3'
const ASH_DARK = '#a1978a'
const DESK_Y = 0.78

/* ===================================================== GREENERY ========= */
/*
 * A leaf, as a ribbon of quads that arcs over, widens past the base and
 * tapers to a point — with a shallow crease down the middle so it catches
 * light along its length. Cones were quicker but read as folded paper.
 */
function makeLeaf({ length = 1, width = 0.15, bend = 0.4, crease = 0.06, segments = 12 }) {
  const position = []
  const index = []
  const COLS = 3

  /* quadratic Bezier: up from the base, then over */
  const at = (t) => {
    const mt = 1 - t
    return [
      2 * mt * t * 0 + t * t * (bend * length),
      2 * mt * t * (length * 0.55) + t * t * (length * 0.92),
    ]
  }

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const [px, py] = at(t)
    const [qx, qy] = at(Math.min(1, t + 0.012))
    const tx = qx - px
    const ty = qy - py
    const tl = Math.hypot(tx, ty) || 1
    /* in-plane normal, used to lift the centre line into a crease */
    const nx = -ty / tl
    const ny = tx / tl
    /* widest just past the base, pointed at the tip */
    const w = width * Math.sin(Math.PI * (0.16 + 0.84 * t))

    for (let j = 0; j < COLS; j++) {
      const side = j - 1
      const lift = side === 0 ? crease * (1 - t) : 0
      position.push(px + nx * lift, py + ny * lift, side * w)
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < COLS - 1; j++) {
      const a = i * COLS + j
      const b = a + COLS
      index.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(position, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/* A few shapes, shared by every plant in the room and varied by transform. */
const LEAF = [
  makeLeaf({ length: 1, width: 0.15, bend: 0.3, crease: 0.06 }),
  makeLeaf({ length: 1, width: 0.19, bend: 0.52, crease: 0.07 }),
  makeLeaf({ length: 1, width: 0.12, bend: 0.16, crease: 0.05 }),
]

const GREENS = ['#4f8a55', '#3f7347', '#5d9a60', '#35603c', '#68a56a']

/*
 * One plant, reused at a dozen sizes around the room. Plants in several
 * places is most of what makes a room read as lived in rather than staged.
 */
function PottedPlant({
  position,
  rotation = 0,
  scale = 1,
  leaves = 9,
  height = 0.42,
  spread = 0.1,
  pot = '#b4654a',
  potTop = '#3b2a20',
  droop = 0,
  seed = 0,
}) {
  const blades = useMemo(
    () =>
      Array.from({ length: leaves }, (_, i) => {
        const r = rand(seed + i * 2.3)
        return {
          angle: (i / leaves) * Math.PI * 2 + rand(seed + i * 5.1) * 0.5,
          /* lean outward; droop pushes the whole plant flatter */
          tilt: 0.12 + r * 0.5 + droop,
          len: height * (0.62 + rand(seed + i * 7.7) * 0.7),
          shape: LEAF[Math.floor(rand(seed + i * 3.7) * LEAF.length)],
          color: GREENS[Math.floor(rand(seed + i * 11.3) * GREENS.length)],
          /* a little twist stops the fan looking machine-made */
          twist: (rand(seed + i * 13.9) - 0.5) * 0.5,
        }
      }),
    [leaves, height, droop, seed]
  )

  const potR = 0.085 + spread * 0.12

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* pot, with a rim */}
      <mesh position={[0, 0.082, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[potR, potR * 0.76, 0.165, 18]} />
        <meshStandardMaterial color={pot} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.172, 0]} castShadow>
        <cylinderGeometry args={[potR * 1.08, potR * 1.04, 0.026, 18]} />
        <meshStandardMaterial color={pot} roughness={0.8} />
      </mesh>
      {/* soil */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[potR * 1.0, potR * 1.0, 0.012, 18]} />
        <meshStandardMaterial color={potTop} roughness={1} />
      </mesh>

      {blades.map((b, i) => (
        <group key={i} rotation={[0, b.angle, 0]}>
          <group
            position={[Math.min(spread * 0.35, potR * 0.5), 0.185, 0]}
            rotation={[b.twist, 0, -b.tilt]}
          >
            <mesh geometry={b.shape} scale={[b.len, b.len, b.len * (0.8 + rand(seed + i) * 0.5)]} castShadow>
              <meshStandardMaterial color={b.color} roughness={0.72} side={2} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

/* ===================================================== WARM LIGHT ======= */
/* A shaded table lamp. The shade glows; the bulb inside does the lighting. */
function TableLamp({ position, night, scale = 1, shade = '#e8d5b5', intensity = 7 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.09, 0.03, 16]} />
        <meshStandardMaterial color="#6f5a44" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.02, 0.23, 10]} />
        <meshStandardMaterial color="#6f5a44" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* the shade, lit from within at night */}
      <mesh position={[0, 0.31, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.13, 0.17, 20, 1, true]} />
        <meshStandardMaterial
          color={shade}
          side={2}
          roughness={0.85}
          emissive="#ffc987"
          emissiveIntensity={night ? 1.0 : 0.08}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#fff2d6" emissive="#ffca72" emissiveIntensity={night ? 3.4 : 0.3} />
      </mesh>
      {night && <pointLight position={[0, 0.3, 0]} color="#ffc078" intensity={intensity} distance={7} decay={1.7} castShadow={false} />}
    </group>
  )
}

/* A candle on the floor. Small pool, big atmosphere. */
function Candle({ position, night }) {
  const flame = useRef()
  useFrame(({ clock }) => {
    if (!flame.current) return
    const t = clock.elapsedTime
    /* two out-of-phase sines read as a flicker; one reads as a pulse */
    const f = 1 + Math.sin(t * 9.1) * 0.12 + Math.sin(t * 3.7) * 0.08
    flame.current.scale.set(1, f, 1)
  })

  return (
    <group position={position}>
      {/* glass holder */}
      <mesh position={[0, 0.055, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.11, 16, 1, true]} />
        <meshStandardMaterial color="#d8cbb4" transparent opacity={0.45} roughness={0.25} side={2} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.09, 16]} />
        <meshStandardMaterial color="#f2e6cf" roughness={0.9} emissive="#ffca86" emissiveIntensity={night ? 1.1 : 0.05} />
      </mesh>
      {night && (
        <>
          <mesh ref={flame} position={[0, 0.115, 0]}>
            <coneGeometry args={[0.012, 0.038, 8]} />
            <meshBasicMaterial color="#ffd89a" toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.14, 0]} color="#ffab5c" intensity={3.4} distance={3.0} decay={1.8} />
        </>
      )}
    </group>
  )
}

/* ============================================= PHOTOS ON THE WALL ======= */
/* A taped-up grid above the shelf — the camera's output, on the wall. */
function WallPhotos() {
  const prints = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: -0.42 + (i % 3) * 0.42,
        y: (i < 3 ? 0.17 : -0.17) + (rand(i * 3.1) - 0.5) * 0.03,
        r: (rand(i * 7.7) - 0.5) * 0.16,
        tex: createPhotoPrint(i),
      })),
    []
  )

  return (
    <group position={[0.34, 2.32, -4.46]}>
      {prints.map((p, i) => (
        <group key={i} position={[p.x, p.y, 0]} rotation={[0, 0, p.r]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.28, 0.008]} />
            <meshStandardMaterial color="#f6f1e6" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.012, 0.006]}>
            <planeGeometry args={[0.32, 0.22]} />
            <meshStandardMaterial map={p.tex} roughness={0.85} />
          </mesh>
          {/* a strip of tape */}
          <mesh position={[0, 0.152, 0.004]} rotation={[0, 0, 0.1]}>
            <planeGeometry args={[0.1, 0.045]} />
            <meshStandardMaterial color="#e8e2d2" transparent opacity={0.55} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* A low table at the end of the couch, to stand a lamp on. */
function SideTable({ night }) {
  return (
    <group position={[-2.15, 0, 0.12]} rotation={[0, 0.2, 0]}>
      <GroundBlob position={[0, 0]} scale={[1.1, 1.1]} opacity={0.42} />
      <B args={[0.44, 0.035, 0.44]} position={[0, 0.48, 0]} color="#6b5744" rough={0.6} />
      <B args={[0.38, 0.03, 0.38]} position={[0, 0.24, 0]} color="#5c4a39" rough={0.7} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.17, 0.24, sz * 0.17]} castShadow>
            <cylinderGeometry args={[0.018, 0.014, 0.48, 8]} />
            <meshStandardMaterial color="#4a3b2d" roughness={0.7} />
          </mesh>
        ))
      )}
      <TableLamp position={[0, 0.5, 0]} night={night} intensity={16} />
      {/* a couple of books under it */}
      <B args={[0.2, 0.03, 0.15]} position={[0.02, 0.27, 0.02]} color={P.red} rough={0.85} rotation={[0, 0.3, 0]} />
      <B args={[0.19, 0.025, 0.14]} position={[0, 0.3, 0.01]} color="#2f6f8f" rough={0.85} rotation={[0, -0.2, 0]} />
    </group>
  )
}

/* ========================================================== DESK ========= */
function Desk() {
  return (
    <group>
      <GroundBlob position={[-2.5, -3.9]} scale={[4.0, 2.2]} opacity={0.42} />
      <B args={[2.8, 0.07, 0.75]} position={[-2.5, DESK_Y, -4.1]} color={ASH} rough={0.55} />
      <B args={[0.08, DESK_Y, 0.7]} position={[-3.86, DESK_Y / 2, -4.1]} color={ASH_DARK} />
      <B args={[0.08, DESK_Y, 0.7]} position={[-1.14, DESK_Y / 2, -4.1]} color={ASH_DARK} />
      <B args={[2.6, 0.06, 0.1]} position={[-2.5, 0.2, -4.4]} color={ASH_DARK} />
      {/* the mat, which also stops the silver laptop floating on a pale top */}
      <B args={[1.15, 0.008, 0.52]} position={[-2.88, DESK_Y + 0.038, -4.0]} color={P.fabricDark} rough={1} cast={false} />
      <PottedPlant position={[-2.25, DESK_Y + 0.035, -4.3]} scale={0.42} leaves={6} height={0.36} spread={0.12} seed={11} />
    </group>
  )
}

/* -------------------------------------------------------- the drawer ---- */
/*
 * Built as a carcass with no front panel and a tray with no lid, so pulling
 * it open reveals an actual cavity. It used to be a solid box with the junk
 * resting on its top face, which slid out looking like a block.
 */
function Drawer() {
  const { active } = useRoom()
  const tray = useRef()
  const open = active === 'drawer'

  useFrame((_, dt) => {
    if (!tray.current) return
    const k = 1 - Math.pow(0.004, Math.min(dt, 0.1))
    tray.current.position.z += ((open ? 0.54 : 0) - tray.current.position.z) * k
  })

  /* loose oddments, scattered rather than arranged */
  const junk = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -0.21 + rand(i * 5.3) * 0.42,
        z: -0.23 + rand(i * 2.7) * 0.26,
        r: rand(i * 9.1) * Math.PI,
        w: 0.11 + rand(i * 3.3) * 0.09,
        d: 0.08 + rand(i * 7.7) * 0.07,
        color: ['#f2ead8', '#e4e9ef', '#efe4c6', '#dfd6c4', '#e8eef2'][i % 5],
      })),
    []
  )

  return (
    <group position={[-1.55, 0, -4.1]}>
      {/* carcass: five panels, open at the front */}
      <B args={[0.74, 0.7, 0.035]} position={[0, 0.35, -0.333]} color={ASH_DARK} rough={0.7} />
      <B args={[0.035, 0.7, 0.7]} position={[-0.353, 0.35, 0]} color={ASH_DARK} rough={0.7} />
      <B args={[0.035, 0.7, 0.7]} position={[0.353, 0.35, 0]} color={ASH_DARK} rough={0.7} />
      <B args={[0.74, 0.035, 0.7]} position={[0, 0.018, 0]} color={ASH_DARK} rough={0.7} />
      <B args={[0.74, 0.035, 0.7]} position={[0, 0.683, 0]} color={ASH_DARK} rough={0.7} />
      {/* the dark of the cavity */}
      <B args={[0.68, 0.64, 0.02]} position={[0, 0.35, -0.312]} color="#1a1712" rough={1} cast={false} />

      <Hotspot id="drawer" label="…what's in here?" focus={FOCUS.drawer} lift={0.6}>
        <group ref={tray}>
          {/* the face */}
          <B args={[0.72, 0.6, 0.035]} position={[0, 0.35, 0.3175]} color={ASH} rough={0.6} />
          <B args={[0.24, 0.045, 0.045]} position={[0, 0.35, 0.357]} color={P.metalDark} metal={0.7} rough={0.35} />

          {/* the tray: a floor and three low walls, no lid */}
          <B args={[0.62, 0.025, 0.54]} position={[0, 0.135, 0.02]} color="#9c9184" rough={0.85} />
          <B args={[0.62, 0.16, 0.022]} position={[0, 0.228, -0.239]} color="#a89d90" rough={0.85} />
          <B args={[0.022, 0.16, 0.54]} position={[-0.299, 0.228, 0.02]} color="#a89d90" rough={0.85} />
          <B args={[0.022, 0.16, 0.54]} position={[0.299, 0.228, 0.02]} color="#a89d90" rough={0.85} />

          {/* what's in it */}
          {junk.map((j, i) => (
            <B
              key={i}
              args={[j.w, 0.008 + rand(i) * 0.012, j.d]}
              position={[j.x, 0.156 + i * 0.009, j.z]}
              rotation={[0, j.r, 0]}
              color={j.color}
              rough={0.95}
            />
          ))}
          {/* a badge */}
          <mesh position={[0.18, 0.155, -0.07]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.012, 18]} />
            <meshStandardMaterial color={P.red} roughness={0.5} />
          </mesh>
          {/* a coiled cable */}
          <mesh position={[-0.17, 0.156, -0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.055, 0.011, 8, 20]} />
            <meshStandardMaterial color="#2c3038" roughness={0.85} />
          </mesh>
          {/* a key */}
          <group position={[0.04, 0.154, -0.19]} rotation={[0, 0.7, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.018, 0.005, 6, 14]} />
              <meshStandardMaterial color="#9a8f74" roughness={0.5} metalness={0.7} />
            </mesh>
            <B args={[0.07, 0.006, 0.011]} position={[0.043, 0, 0]} color="#9a8f74" rough={0.5} metal={0.7} />
          </group>
        </group>
      </Hotspot>
    </group>
  )
}

/* ------------------------------------------------------------ laptop ---- */
const ALU = { color: '#b7bdc6', metalness: 0.62, roughness: 0.34 }
const LAPTOP_W = 0.42
const K = LAPTOP_W / 0.33 /* everything else scales off the width */

function Laptop({ night }) {
  const { hovered, active } = useRoom()
  const awake = hovered === 'work' || active === 'work'

  const screen = useMemo(() => createScreen(), [])
  const deck = useMemo(() => createDeck(), [])
  useEffect(() => () => {
    screen.tex.dispose()
    deck.dispose()
  }, [screen, deck])

  /* the charge cable, running off the back of the desk */
  const cable = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0.2, 0.01, -0.12),
        new Vector3(0.34, -0.06, -0.2),
        new Vector3(0.44, -0.34, -0.22),
        new Vector3(0.4, -0.66, -0.16),
        new Vector3(0.46, -0.78, -0.05),
      ]),
    []
  )

  const lid = useRef()
  const glow = useRef()
  const blink = useRef(0)
  const caret = useRef(true)
  const mode = useRef('idle')

  useEffect(() => {
    mode.current = awake ? 'hover' : 'idle'
    if (!awake) caret.current = true
    blink.current = 0
    screen.draw(mode.current, caret.current)
  }, [awake, screen])

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1)

    /* Only blink while someone is looking — a full-canvas redraw and texture
     * upload twice a second is not worth a sub-pixel caret. */
    if (awake) {
      blink.current += d
      if (blink.current > 0.55) {
        blink.current = 0
        caret.current = !caret.current
        screen.draw(mode.current, caret.current)
      }
    }

    if (lid.current) {
      const want = awake ? -0.3 : -0.2
      lid.current.rotation.x += (want - lid.current.rotation.x) * (1 - Math.pow(0.004, d))
    }
    if (glow.current) {
      /* a slow flicker, so the machine reads as on rather than lit */
      const alive = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.07
      const want = (night ? 1.5 : 0.5) * (awake ? 1.7 : 1) * alive
      glow.current.intensity += (want - glow.current.intensity) * (1 - Math.pow(0.02, d))
    }
  })

  return (
    <Hotspot
      id="work"
      focus={FOCUS.work}
      lift={0.46}
      position={[-2.85, DESK_Y + 0.042, -3.98]}
      rotation={[0, 0.3, 0]}
    >
      <group scale={K}>
        <RoundedBox args={[0.33, 0.017, 0.23]} radius={0.005} smoothness={3} position={[0, 0.0085, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...ALU} />
        </RoundedBox>

        <mesh position={[0, 0.0176, 0.002]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.205]} />
          <meshStandardMaterial map={deck} roughness={0.72} metalness={0.15} />
        </mesh>

        <group ref={lid} position={[0, 0.0135, -0.112]} rotation={[-0.2, 0, 0]}>
          <RoundedBox args={[0.33, 0.215, 0.009]} radius={0.0035} smoothness={3} position={[0, 0.1075, -0.003]} castShadow>
            <meshStandardMaterial {...ALU} />
          </RoundedBox>
          <mesh position={[0, 0.1075, 0.0035]}>
            <planeGeometry args={[0.302, 0.188]} />
            <meshBasicMaterial map={screen.tex} toneMapped={false} />
          </mesh>
          {/* a sticker on the bezel — the lid's back never faces the camera */}
          <mesh position={[0.126, 0.0125, 0.0045]}>
            <circleGeometry args={[0.0085, 20]} />
            <meshStandardMaterial color={P.red} roughness={0.5} />
          </mesh>
          {/* tight to the panel: a wide halo reads as a floating orb */}
          <pointLight ref={glow} position={[0, 0.1, 0.055]} color="#8fdcff" intensity={0.5} distance={0.62} decay={2} />
        </group>

        <mesh castShadow>
          <tubeGeometry args={[cable, 28, 0.007, 7, false]} />
          <meshStandardMaterial color="#2c3038" roughness={0.85} />
        </mesh>
      </group>
    </Hotspot>
  )
}

/* ---------------------------------------------------------- notebook ---- */
/* Open, with a pen across it — it has its own section, so it should look
 * like something you were writing in a minute ago. */
function Notebook() {
  const lines = useMemo(() => Array.from({ length: 7 }, (_, i) => -0.13 + i * 0.038), [])

  return (
    <Hotspot
      id="thinking"
      focus={FOCUS.thinking}
      lift={0.34}
      position={[-1.85, DESK_Y + 0.036, -3.95]}
      rotation={[0, -0.42, 0]}
    >
      {/* covers */}
      <B args={[0.58, 0.012, 0.4]} position={[0, 0.006, 0]} color={P.ink} rough={0.85} />
      {/* the two open pages, tilted into a shallow V */}
      <group position={[0, 0.014, 0]}>
        <mesh position={[-0.141, 0.006, 0]} rotation={[0, 0, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.27, 0.011, 0.37]} />
          <meshStandardMaterial color={P.paper} roughness={0.95} />
        </mesh>
        <mesh position={[0.141, 0.006, 0]} rotation={[0, 0, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.27, 0.011, 0.37]} />
          <meshStandardMaterial color={P.paper} roughness={0.95} />
        </mesh>
        {/* handwriting on the left page */}
        {lines.map((z, i) => (
          <mesh key={i} position={[-0.148 + rand(i) * 0.02, 0.0125, z]}>
            <boxGeometry args={[0.13 + rand(i * 3) * 0.09, 0.001, 0.005]} />
            <meshStandardMaterial color="#6b7385" roughness={1} />
          </mesh>
        ))}
      </group>
      {/* spine and ribbon */}
      <B args={[0.02, 0.016, 0.4]} position={[0, 0.012, 0]} color={P.ink} rough={0.7} />
      <B args={[0.012, 0.002, 0.3]} position={[0.08, 0.021, 0.08]} color={P.red} rough={0.8} rotation={[0, 0.2, 0]} />
      {/* pen resting across the pages */}
      <mesh position={[0.06, 0.028, 0.04]} rotation={[0, 0.9, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.009, 0.0075, 0.3, 12]} />
        <meshStandardMaterial color="#26292f" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0.171, 0.028, -0.055]} rotation={[0, 0.9, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.0075, 0.03, 12]} />
        <meshStandardMaterial color={P.metal} metalness={0.7} roughness={0.3} />
      </mesh>
    </Hotspot>
  )
}

/* --------------------------------------------------------- desk lamp ---- */
/*
 * A gooseneck task lamp: weighted base, a curved neck swept as a tube, and a
 * shade that points down at the desk. The light is a narrow spot with a low
 * penumbra plus a visible cone and a pool on the desk — a wide, soft spot
 * just washes the wall and never reads as coming from the lamp.
 */
const LAMP_HEAD = [0.3, 0.5, 0.075]

function DeskLamp({ night }) {
  const { toggleNight, hovered, setHovered } = useRoom()

  const neck = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0.035, 0),
        new Vector3(0, 0.26, 0),
        new Vector3(0.015, 0.44, 0.012),
        new Vector3(0.12, 0.545, 0.04),
        new Vector3(LAMP_HEAD[0], LAMP_HEAD[1] + 0.035, LAMP_HEAD[2]),
      ]),
    []
  )

  /* Aimed at a point on the desk just in front of the shade. This object is
   * a CHILD of the lamp group, so the position is local — giving it world
   * coordinates here aims the spot off into the room, which is what the
   * previous lamp was doing. Local y = -0.035 is the desk surface. */
  const target = useMemo(() => {
    const o = new Object3D()
    o.position.set(0.44, -0.035, 0.2)
    return o
  }, [])

  const pool = useMemo(() => createGlow('rgba(255,236,200,0.95)'), [])
  const beamFade = useMemo(() => createBeamFade(), [])

  return (
    <group
      position={[-3.72, DESK_Y + 0.035, -4.28]}
      rotation={[0, 0.5, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered('lamp')
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered((h) => (h === 'lamp' ? null : h))
      }}
      onClick={(e) => {
        e.stopPropagation()
        toggleNight()
      }}
    >
      {/* weighted base */}
      <mesh position={[0, 0.016, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.125, 0.135, 0.032, 24]} />
        <meshStandardMaterial color="#2b2e34" metalness={0.5} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.042, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.1, 0.026, 24]} />
        <meshStandardMaterial color="#3a3e46" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* neck */}
      <mesh castShadow>
        <tubeGeometry args={[neck, 40, 0.0145, 10, false]} />
        <meshStandardMaterial color="#33373f" metalness={0.55} roughness={0.38} />
      </mesh>

      {/* head */}
      <group position={LAMP_HEAD} rotation={[0.16, 0, -0.14]}>
        <mesh position={[0, 0.005, 0]} castShadow>
          <sphereGeometry args={[0.028, 14, 12]} />
          <meshStandardMaterial color="#33373f" metalness={0.55} roughness={0.38} />
        </mesh>
        {/* shade: open at the bottom so the bulb shows */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <coneGeometry args={[0.115, 0.155, 24, 1, true]} />
          <meshStandardMaterial color={P.red} roughness={0.5} metalness={0.1} side={2} />
        </mesh>
        {/* a warm liner, so the inside is bright rather than a red void */}
        <mesh position={[0, -0.082, 0]}>
          <coneGeometry args={[0.107, 0.145, 24, 1, true]} />
          <meshStandardMaterial
            color="#fff1d8"
            side={1}
            roughness={0.85}
            emissive="#ffc575"
            emissiveIntensity={night ? 1.6 : 0.2}
          />
        </mesh>
        <mesh position={[0, -0.135, 0]}>
          <sphereGeometry args={[0.038, 14, 12]} />
          <meshStandardMaterial color="#fff4de" emissive="#ffca72" emissiveIntensity={night ? 4 : 0.5} toneMapped={false} />
        </mesh>

        {/* the beam itself, visible only once the room is dark */}
        {night && (
          <mesh position={[0, -0.52, 0]} renderOrder={3} raycast={NO_HIT} userData={DECOR}>
            <coneGeometry args={[0.34, 0.76, 28, 1, true]} />
            <meshBasicMaterial
              map={beamFade}
              color="#ffce8a"
              transparent
              opacity={0.3}
              depthWrite={false}
              side={2}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>

      <primitive object={target} />
      <spotLight
        position={[LAMP_HEAD[0], LAMP_HEAD[1] - 0.13, LAMP_HEAD[2]]}
        target={target}
        color="#ffbe72"
        angle={0.42}
        penumbra={0.32}
        intensity={night ? 26 : 6}
        distance={4.2}
        decay={1.7}
      />
      {/* and a soft spill, so the lamp is not a single hard disc */}
      {night && <pointLight position={[0.28, 0.42, 0.07]} color="#ffc078" intensity={2.4} distance={2.6} decay={2} />}

      {/* the pool it throws on the desk */}
      <mesh position={[0.36, -0.03, 0.14]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={NO_HIT} userData={DECOR}>
        <planeGeometry args={[1.05, 0.85]} />
        <meshBasicMaterial
          map={pool}
          transparent
          opacity={night ? 0.85 : 0.22}
          depthWrite={false}
          color="#ffca80"
          toneMapped={false}
        />
      </mesh>

      {hovered === 'lamp' && (
        <Html center position={[0.15, 0.95, 0]} zIndexRange={[20, 0]} pointerEvents="none">
          <div className="tag">{night ? 'morning' : 'night'}</div>
        </Html>
      )}
    </group>
  )
}

/* ------------------------------------------------------------- chair ---- */
/* Pushed back and turned, as if someone just got up. */
function Chair() {
  return (
    <group position={[-2.3, 0, -2.78]} rotation={[0, 0.58, 0]}>
      <GroundBlob position={[0, 0]} scale={[1.5, 1.5]} opacity={0.4} />
      <B args={[0.52, 0.07, 0.5]} position={[0, 0.46, 0]} color="#7a8cb2" rough={0.92} />
      <B args={[0.48, 0.55, 0.07]} position={[0, 0.76, 0.24]} color="#6d7ea3" rough={0.92} />
      <mesh position={[0, 0.23, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.46, 12]} />
        <meshStandardMaterial color={P.metal} metalness={0.65} roughness={0.35} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.36, 0.05, 0.06]} />
            <meshStandardMaterial color={P.metal} metalness={0.6} roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ========================================================= BOOKSHELF ==== */
/* Loosely grouped by colour per shelf, with a few laid flat — random
 * saturated spines read as noise from across the room. */
const FAMILIES = [
  ['#b8362e', '#c8102e', '#a3122b', '#d4553f'],
  ['#2f6f8f', '#2c3550', '#3f5f8a', '#4a7a9e'],
  ['#c0803a', '#d79a3a', '#b9a068', '#d8cfc0'],
  ['#4a7a5c', '#3f6b52', '#5d8f6a', '#7a9e6a'],
]

function Bookshelf({ night }) {
  const { books, stacks } = useMemo(() => {
    const shelfYs = [0.4, 0.96, 1.5, 1.94]
    const books = []
    const stacks = []

    /* Headroom above each shelf. The top one has far less than the rest, and
     * books sized for the others poked straight through the top board —
     * which from across the room looked like books spilling over the top. */
    const TOP_BOARD = 2.275
    const headroom = (si) =>
      (si < shelfYs.length - 1 ? shelfYs[si + 1] - 0.02 : TOP_BOARD) - (shelfYs[si] + 0.02)

    shelfYs.forEach((y, si) => {
      const fam = FAMILIES[si % FAMILIES.length]
      const tallest = headroom(si) * 0.86
      let z = -0.92
      let i = 0
      while (z < 0.84 && i < 24) {
        const laid = i > 3 && z < 0.4 && rand(si * 17 + i * 2.7) > 0.84
        if (laid) {
          const n = 2 + Math.floor(rand(si + i) * 2)
          stacks.push({
            y,
            z: z + 0.17,
            books: Array.from({ length: n }, (_, k) => ({
              h: Math.min(0.028 + rand(si + i + k) * 0.016, tallest / 3.2),
              color: fam[Math.floor(rand(si * 3 + i + k * 5) * fam.length)],
            })),
          })
          z += 0.36
        } else {
          const w = 0.05 + rand(si * 31 + i * 7) * 0.07
          books.push({
            y,
            z: z + w / 2,
            w,
            h: Math.min(0.24 + rand(si * 13 + i * 3) * 0.14, tallest),
            lean: rand(si * 5 + i) > 0.92 ? 0.22 : 0,
            color: fam[Math.floor(rand(si * 9 + i * 2) * fam.length)],
          })
          z += w + 0.012
        }
        i++
      }
    })
    return { books, stacks }
  }, [])

  return (
    <>
      <GroundBlob position={[-4.0, -2.95]} scale={[2.2, 3.4]} opacity={0.45} />
      <Hotspot id="think" focus={FOCUS.think} lift={1.5} position={[-4.2, 0, -2.95]}>
        <B args={[0.5, 2.3, 0.06]} position={[0, 1.15, -1.02]} color="#5e4029" />
        <B args={[0.5, 2.3, 0.06]} position={[0, 1.15, 1.02]} color="#5e4029" />
        <B args={[0.52, 0.05, 2.1]} position={[0, 2.3, 0]} color="#5e4029" />
        <B args={[0.5, 0.04, 2.0]} position={[0, 0.02, 0]} color="#4a3220" />
        {[0.36, 0.92, 1.46, 1.9].map((y) => (
          <B key={y} args={[0.5, 0.04, 2.0]} position={[0, y, 0]} color="#8a5f3a" />
        ))}
        {/* warm strips tucked under the front edge of each shelf */}
        {[0.36, 0.92, 1.46, 1.9].map((y) => (
          <mesh key={`s${y}`} position={[0.21, y - 0.035, 0]}>
            <boxGeometry args={[0.028, 0.012, 1.84]} />
            <meshStandardMaterial
              color="#fff0d0"
              emissive="#ffc87a"
              emissiveIntensity={night ? 2.8 : 0.12}
              toneMapped={false}
            />
          </mesh>
        ))}
        {night &&
          [0.5, 1.6].map((y) => (
            <pointLight key={`pl${y}`} position={[0.45, y, 0]} color="#ffbe78" intensity={3.4} distance={3.6} decay={1.8} />
          ))}
        <B args={[0.04, 2.3, 2.1]} position={[-0.25, 1.15, 0]} color="#3d2a1b" cast={false} />

        {books.map((b, i) => (
          <mesh key={i} position={[0.02, b.y + b.h / 2, b.z]} rotation={[b.lean, 0, 0]} castShadow>
            <boxGeometry args={[0.22, b.h, b.w]} />
            <meshStandardMaterial color={b.color} roughness={0.85} />
          </mesh>
        ))}

        {stacks.map((s, i) => {
          let y = s.y + 0.02
          return (
            <group key={`s${i}`}>
              {s.books.map((bk, k) => {
                const at = y
                y += bk.h
                return (
                  <mesh key={k} position={[0.02, at + bk.h / 2, s.z]} rotation={[0, rand(i + k) * 0.18, 0]} castShadow>
                    <boxGeometry args={[0.2, bk.h, 0.3]} />
                    <meshStandardMaterial color={bk.color} roughness={0.85} />
                  </mesh>
                )
              })}
            </group>
          )
        })}

        {/* a framed photo and a small plant, because nobody's shelf is only books */}
        <group position={[0.04, 1.62, 0.66]} rotation={[0, -0.35, 0]}>
          <B args={[0.02, 0.22, 0.17]} position={[0, 0.11, 0]} color="#4a3220" />
          <mesh position={[0.012, 0.11, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.13, 0.18]} />
            <meshStandardMaterial color="#8fa6bd" roughness={0.9} />
          </mesh>
        </group>
        <PottedPlant position={[0.04, 0.98, 0.78]} scale={0.5} leaves={6} height={0.34} spread={0.12} seed={2} />
        {/* trailing greenery along the top */}
        <PottedPlant position={[0.01, 2.33, -0.78]} scale={0.5} leaves={7} height={0.36} spread={0.12} droop={0.55} seed={5} />
        <PottedPlant position={[0.02, 2.33, -0.28]} scale={0.62} leaves={10} height={0.46} spread={0.16} droop={0.2} seed={14} />
        <PottedPlant position={[0.0, 2.33, 0.2]} scale={0.42} leaves={6} height={0.3} spread={0.1} droop={0.75} seed={8} />
        <PottedPlant position={[0.03, 2.33, 0.66]} scale={0.56} leaves={8} height={0.4} spread={0.14} droop={0.35} seed={21} />
        <PottedPlant position={[0.01, 2.33, 0.97]} scale={0.36} leaves={5} height={0.26} spread={0.09} droop={0.85} seed={33} />
      </Hotspot>
    </>
  )
}

/* Sketches taped to the wall above the shelf — now with something on them. */
function Sketches() {
  const notes = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        z: -0.8 + i * 0.42,
        y: 2.78 + (rand(i) - 0.5) * 0.3,
        r: (rand(i * 7) - 0.5) * 0.2,
        tex: createScribbleNote(i),
      })),
    []
  )
  return (
    <group position={[-4.44, 0, -2.95]} rotation={[0, Math.PI / 2, 0]}>
      {notes.map((s, i) => (
        <mesh key={i} position={[s.z, s.y, 0]} rotation={[0, 0, s.r]} castShadow>
          <planeGeometry args={[0.3, 0.38]} />
          <meshStandardMaterial map={s.tex} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================== FRAMED PICTURES ===== */
/*
 * Two pictures hang on the left wall. Both are the same object: a black
 * frame, a recessed print, and a hotspot. Only the artwork differs.
 */
const FRAME_BLACK = '#121215'

function Art({ map }) {
  return <meshStandardMaterial map={map} roughness={0.52} metalness={0.05} />
}

/* A real photo, if one has been dropped into public/ and named in content.js */
function LoadedArt({ url }) {
  const tex = useLoader(TextureLoader, url)
  tex.colorSpace = SRGBColorSpace
  return <Art map={tex} />
}

function GeneratedPortrait() {
  const tex = useMemo(() => createPortrait(), [])
  return <Art map={tex} />
}

/* w/h are the frame's outer size; the print is inset behind the mouldings. */
function PictureFrame({ w, h, children }) {
  const bar = 0.055
  const depth = 0.05
  return (
    <group>
      <B args={[w, h, depth]} position={[0, 0, -0.012]} color={FRAME_BLACK} rough={0.55} />
      {/* mouldings, standing proud so the print is genuinely recessed */}
      <B args={[w, bar, depth + 0.02]} position={[0, h / 2 - bar / 2, 0.006]} color={FRAME_BLACK} rough={0.42} />
      <B args={[w, bar, depth + 0.02]} position={[0, -h / 2 + bar / 2, 0.006]} color={FRAME_BLACK} rough={0.42} />
      <B args={[bar, h, depth + 0.02]} position={[-w / 2 + bar / 2, 0, 0.006]} color={FRAME_BLACK} rough={0.42} />
      <B args={[bar, h, depth + 0.02]} position={[w / 2 - bar / 2, 0, 0.006]} color={FRAME_BLACK} rough={0.42} />
      {children}
    </group>
  )
}

function SalahFrame() {
  const photo = SECTIONS.liverpool.photo
  return (
    <Hotspot
      id="liverpool"
      focus={FOCUS.liverpool}
      lift={0.62}
      position={[-4.44, 1.8, -0.9]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <PictureFrame w={0.68} h={0.88}>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.55, 0.75]} />
          {photo ? <LoadedArt url={photo} /> : <GeneratedPortrait />}
        </mesh>
      </PictureFrame>
    </Hotspot>
  )
}

function VinylFrame() {
  const art = useMemo(() => createVinylArt(), [])
  return (
    <Hotspot
      id="music"
      focus={FOCUS.music}
      lift={0.64}
      position={[-4.44, 1.75, 3.4]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <PictureFrame w={0.95} h={0.95}>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.83, 0.83]} />
          <Art map={art} />
        </mesh>
      </PictureFrame>
    </Hotspot>
  )
}

/* ======================================================= TV AND PS5 ===== */
/*
 * The screen shows a window onto a strip of four shots. It drifts slowly
 * across the current one, then jumps a whole panel — a cut. Only the
 * texture's offset changes, so nothing is redrawn or re-uploaded per frame.
 */
const SHOT_SECONDS = 7.5

function Telly({ night }) {
  const tv = useMemo(() => createTvReel(), [])
  const glow = useRef()
  const shot = useRef(0)
  const elapsed = useRef(0)

  useEffect(() => {
    tv.wrapS = RepeatWrapping
    tv.repeat.x = REEL.repeat
    tv.offset.x = 0
    return () => tv.dispose()
  }, [tv])

  useFrame((_, dt) => {
    elapsed.current += dt
    if (elapsed.current > SHOT_SECONDS) {
      elapsed.current = 0
      shot.current = (shot.current + 1) % REEL.shots
    }
    const through = elapsed.current / SHOT_SECONDS
    tv.offset.x = shot.current * REEL.step + through * REEL.drift

    /* the spill on the wall breathes a little with the picture */
    if (glow.current) {
      glow.current.intensity = 5.4 + Math.sin(elapsed.current * 1.7) * 0.5 + Math.sin(elapsed.current * 0.6) * 0.4
    }
  })

  return (
    <>
      <GroundBlob position={[-4.0, 1.5]} scale={[2.2, 3.6]} opacity={0.45} />
      <Hotspot id="play" focus={FOCUS.play} lift={1.15} position={[-4.22, 0, 1.5]}>
        {/* media unit */}
        <B args={[0.45, 0.46, 2.4]} position={[0, 0.23, 0]} color="#4a3220" rough={0.7} />
        <B args={[0.48, 0.04, 2.44]} position={[0.01, 0.48, 0]} color={ASH_DARK} rough={0.55} />

        {/*
          The television stands proud of the unit on a neck. It used to sit
          straight on the top, which put the bottom of the panel at the same
          height as anything else on the shelf — the console ended up
          intersecting the picture.
        */}
        <group position={[0.06, 1.28, 0]} rotation={[0, Math.PI / 2, 0]}>
          <B args={[2.0, 1.15, 0.06]} position={[0, 0, 0]} color={P.ink} rough={0.6} />
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[1.9, 1.05]} />
            <meshBasicMaterial map={tv} toneMapped={false} />
          </mesh>
          <B args={[0.12, 0.18, 0.1]} position={[0, -0.665, 0]} color={P.metalDark} metal={0.5} />
          <B args={[0.52, 0.035, 0.2]} position={[0, -0.772, 0]} color={P.metalDark} metal={0.5} />
        </group>
        {night && (
          <pointLight ref={glow} position={[0.7, 1.28, 0]} color="#8fb4e8" intensity={5.4} distance={5.5} decay={2} />
        )}

        {/* the console, lying flat on the shelf under the screen */}
        <group position={[0.02, 0.553, 0.62]}>
          <B args={[0.19, 0.1, 0.4]} position={[0, 0, 0]} color={P.ink} rough={0.5} />
          {[-1, 1].map((side) => (
            <B key={side} args={[0.205, 0.115, 0.085]} position={[0, 0, side * 0.163]} color={P.cream} rough={0.4} />
          ))}
          <mesh position={[0.098, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.13, 0.012]} />
            <meshStandardMaterial color="#7fd8ff" emissive="#7fd8ff" emissiveIntensity={night ? 3 : 1} toneMapped={false} />
          </mesh>
        </group>

        {/* a controller left on the shelf */}
        <group position={[0.02, 0.53, -0.7]} rotation={[0, 0.4, 0]}>
          <B args={[0.14, 0.05, 0.2]} position={[0, 0, 0]} color={P.cream} rough={0.45} />
          <B args={[0.1, 0.045, 0.09]} position={[0, 0, 0.13]} color={P.cream} rough={0.45} />
        </group>
      </Hotspot>
    </>
  )
}

/* ============================================================ GAMER ===== */
/*
 * Someone on the couch with a controller. Built inside the couch's group, so
 * it inherits the couch's rotation and faces the television for free.
 *
 * Proportions matter more than detail at this size: a single fat capsule for
 * the torso reads as a barrel, and a shin longer than its thigh reads as a
 * puppet. Shoulders are a separate crosswise capsule, and the thigh and shin
 * are the same length, which the seat height then fixes.
 */
const SKIN = '#c08a60'
const SHIRT = '#47607f'
const SHIRT_DARK = '#3b5069'
const TROUSERS = '#2e3646'
const HAIR = '#241a16'

const _up = new Vector3(0, 1, 0)

function Limb({ from, to, radius, color, rough = 0.85 }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from)
    const b = new Vector3(...to)
    const dir = b.clone().sub(a)
    const len = dir.length()
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(_up, dir.clone().normalize()),
      length: Math.max(len - radius * 2, 0.02),
    }
  }, [from, to, radius])

  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <capsuleGeometry args={[radius, length, 6, 14]} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  )
}

function Gamer() {
  const HIP = 0.62
  const SHOULDER = 1.0
  const SHOULDER_HALF = 0.17

  return (
    <group position={[-0.46, 0, -0.04]} rotation={[0, 0.07, 0]}>
      {/* spine, leaning back into the cushions */}
      <Limb from={[0, HIP, 0.0]} to={[0, SHOULDER, -0.13]} radius={0.115} color={SHIRT} />
      {/* shoulders across the top, so the torso is a T and not a barrel */}
      <Limb
        from={[-SHOULDER_HALF, SHOULDER - 0.03, -0.12]}
        to={[SHOULDER_HALF, SHOULDER - 0.03, -0.12]}
        radius={0.072}
        color={SHIRT}
      />
      <mesh position={[0, SHOULDER + 0.015, -0.12]} castShadow>
        <cylinderGeometry args={[0.062, 0.07, 0.03, 14]} />
        <meshStandardMaterial color={SHIRT_DARK} roughness={0.9} />
      </mesh>

      {/* neck and head */}
      <Limb from={[0, SHOULDER + 0.01, -0.125]} to={[0, SHOULDER + 0.07, -0.115]} radius={0.042} color={SKIN} />
      <mesh position={[0, 1.165, -0.105]} scale={[1, 1.08, 1.03]} castShadow>
        <sphereGeometry args={[0.098, 20, 18]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      {/* hair: a cap that follows the skull, not a second sphere hung off
        * the back — that read as a bun. */}
      <mesh position={[0, 1.172, -0.108]} scale={[1.04, 1.02, 1.09]} castShadow>
        <sphereGeometry args={[0.1, 20, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color={HAIR} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.128, -0.15]} scale={[1, 0.8, 0.7]} castShadow>
        <sphereGeometry args={[0.093, 16, 14]} />
        <meshStandardMaterial color={HAIR} roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.096, 1.163, -0.105]} scale={[0.5, 1, 0.8]} castShadow>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
      ))}

      {/* arms forward to the controller */}
      {[-1, 1].map((side) => (
        <group key={`a${side}`}>
          <Limb from={[side * SHOULDER_HALF, SHOULDER - 0.05, -0.12]} to={[side * 0.2, 0.8, 0.07]} radius={0.05} color={SHIRT} />
          <Limb from={[side * 0.2, 0.8, 0.07]} to={[side * 0.085, 0.762, 0.25]} radius={0.04} color={SKIN} />
          <mesh position={[side * 0.078, 0.757, 0.27]} castShadow>
            <sphereGeometry args={[0.044, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* the controller */}
      <group position={[0, 0.752, 0.3]} rotation={[-0.4, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.098, 0.034, 0.058]} />
          <meshStandardMaterial color="#e8e6e2" roughness={0.45} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.07, -0.02, 0.012]} rotation={[0.2, side * -0.22, side * 0.18]} castShadow>
            <capsuleGeometry args={[0.018, 0.042, 4, 10]} />
            <meshStandardMaterial color="#e8e6e2" roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.019, 0.004]}>
          <boxGeometry args={[0.04, 0.004, 0.019]} />
          <meshStandardMaterial color="#9fd8ff" emissive="#7fd8ff" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>

      {/* legs: thigh and shin the same length, feet flat on the floor */}
      {[-1, 1].map((side) => (
        <group key={`l${side}`}>
          <Limb from={[side * 0.085, HIP - 0.01, -0.01]} to={[side * 0.115, HIP - 0.04, 0.45]} radius={0.076} color={TROUSERS} />
          <mesh position={[side * 0.115, HIP - 0.04, 0.45]} castShadow>
            <sphereGeometry args={[0.073, 12, 12]} />
            <meshStandardMaterial color={TROUSERS} roughness={0.9} />
          </mesh>
          <Limb from={[side * 0.115, HIP - 0.05, 0.45]} to={[side * 0.125, 0.115, 0.5]} radius={0.058} color={TROUSERS} />
          <mesh position={[side * 0.125, 0.048, 0.565]} rotation={[0.06, 0, 0]} castShadow>
            <boxGeometry args={[0.088, 0.062, 0.2]} />
            <meshStandardMaterial color="#20242c" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ============================================================ COUCH ===== */
/*
 * Built facing +z and turned to face the television. Everything upholstered
 * is a rounded box with a generous radius — square corners are what made the
 * old one read as a stack of crates.
 */
const COUCH = '#988c7d'
const COUCH_DARK = '#80755f'
const SOFT = { roughness: 0.97 }

function Couch() {
  return (
    <>
      <GroundBlob position={[-2.0, 1.5]} scale={[3.2, 3.6]} opacity={0.46} />
      <group position={[-2.0, 0, 1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[2.06, 0.28, 0.92]} radius={0.05} smoothness={3} position={[0, 0.2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={COUCH_DARK} {...SOFT} />
        </RoundedBox>

        {[-0.5, 0.5].map((x) => (
          <RoundedBox key={x} args={[0.96, 0.22, 0.8]} radius={0.07} smoothness={4} position={[x, 0.45, 0.04]} castShadow receiveShadow>
            <meshStandardMaterial color={COUCH} {...SOFT} />
          </RoundedBox>
        ))}

        <RoundedBox args={[2.06, 0.56, 0.2]} radius={0.05} smoothness={3} position={[0, 0.62, -0.36]} castShadow>
          <meshStandardMaterial color={COUCH_DARK} {...SOFT} />
        </RoundedBox>
        {[-0.5, 0.5].map((x) => (
          <RoundedBox
            key={`b${x}`}
            args={[0.96, 0.46, 0.2]}
            radius={0.07}
            smoothness={4}
            position={[x, 0.66, -0.24]}
            rotation={[-0.13, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color={COUCH} {...SOFT} />
          </RoundedBox>
        ))}

        {/* rolled arms */}
        {[-0.95, 0.95].map((x) => (
          <group key={`a${x}`}>
            <RoundedBox args={[0.2, 0.44, 0.92]} radius={0.07} smoothness={4} position={[x, 0.4, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={COUCH_DARK} {...SOFT} />
            </RoundedBox>
            <mesh position={[x, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.92, 20]} />
              <meshStandardMaterial color={COUCH_DARK} {...SOFT} />
            </mesh>
          </group>
        ))}

        {[-0.88, 0.88].map((x) =>
          [-0.34, 0.34].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.032, z]} castShadow>
              <cylinderGeometry args={[0.034, 0.026, 0.064, 10]} />
              <meshStandardMaterial color="#3d2a1b" roughness={0.7} />
            </mesh>
          ))
        )}

        <RoundedBox args={[0.36, 0.36, 0.14]} radius={0.055} smoothness={4} position={[-0.72, 0.66, -0.04]} rotation={[-0.3, 0.2, 0.25]} castShadow>
          <meshStandardMaterial color={P.red} {...SOFT} />
        </RoundedBox>
        <RoundedBox args={[0.34, 0.34, 0.13]} radius={0.05} smoothness={4} position={[0.74, 0.64, -0.06]} rotation={[-0.26, -0.3, -0.18]} castShadow>
          <meshStandardMaterial color={P.fabricDark} {...SOFT} />
        </RoundedBox>

        <Gamer />

        {/* a throw slung over one arm */}
        <group position={[0.95, 0, 0.08]}>
          <RoundedBox args={[0.32, 0.055, 0.6]} radius={0.022} smoothness={3} position={[0, 0.665, 0]} castShadow>
            <meshStandardMaterial color={P.fabric} {...SOFT} />
          </RoundedBox>
          <RoundedBox args={[0.06, 0.42, 0.56]} radius={0.022} smoothness={3} position={[0.14, 0.45, 0]} rotation={[0, 0, 0.1]} castShadow>
            <meshStandardMaterial color={P.fabric} {...SOFT} />
          </RoundedBox>
        </group>
      </group>
    </>
  )
}

/* A standing lamp for the corner by the plant. */
function FloorLamp({ position, night }) {
  const pool = useMemo(() => createGlow('rgba(255,236,200,0.95)'), [])
  return (
    <group position={position}>
      <GroundBlob position={[0, 0]} scale={[0.95, 0.95]} opacity={0.4} />
      <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.036, 24]} />
        <meshStandardMaterial color="#3a3026" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.019, 0.024, 1.38, 12]} />
        <meshStandardMaterial color="#6f5a44" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.235, 0.3, 26, 1, true]} />
        <meshStandardMaterial
          color="#e8d5b5"
          side={2}
          roughness={0.9}
          emissive="#ffc987"
          emissiveIntensity={night ? 1.15 : 0.06}
        />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.062, 14, 12]} />
        <meshStandardMaterial color="#fff2d6" emissive="#ffca72" emissiveIntensity={night ? 3.2 : 0.25} />
      </mesh>
      {night && <pointLight position={[0, 1.46, 0]} color="#ffbe78" intensity={15} distance={7} decay={1.7} />}
      {night && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={NO_HIT} userData={DECOR}>
          <planeGeometry args={[2.1, 2.1]} />
          <meshBasicMaterial map={pool} transparent opacity={0.42} depthWrite={false} color="#ffca80" toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/* ====================================================== THE SHELF ======= */
/*
 * Three separate things on one shelf, each its own hotspot: a camera, a
 * model car and a speaker. The shelf itself is not clickable — the objects
 * are — so each gets its own transform and its own camera framing.
 */

function Dslr() {
  return (
    <Hotspot
      id="photos"
      focus={FOCUS.photos}
      lift={0.34}
      position={[-0.58, 0.03, 0]}
      rotation={[0, 0.34, 0]}
    >
      {/* body */}
      <RoundedBox args={[0.27, 0.165, 0.1]} radius={0.016} smoothness={3} position={[0, 0.085, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#26282e" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      {/* grip */}
      <RoundedBox args={[0.07, 0.16, 0.115]} radius={0.018} smoothness={3} position={[-0.11, 0.082, 0.005]} castShadow>
        <meshStandardMaterial color="#1b1d22" roughness={0.85} />
      </RoundedBox>
      {/* pentaprism */}
      <RoundedBox args={[0.095, 0.05, 0.08]} radius={0.012} smoothness={3} position={[0.02, 0.19, -0.005]} castShadow>
        <meshStandardMaterial color="#26282e" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      {/* hot shoe */}
      <B args={[0.05, 0.012, 0.045]} position={[0.02, 0.219, -0.005]} color="#3a3d44" rough={0.5} metal={0.4} />
      {/* shutter button */}
      <mesh position={[-0.095, 0.172, 0.02]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.01, 12]} />
        <meshStandardMaterial color="#8d9098" roughness={0.35} metalness={0.6} />
      </mesh>

      {/* lens */}
      <group position={[0.02, 0.085, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.058, 0.055, 0.11, 24]} />
          <meshStandardMaterial color="#1e2025" roughness={0.6} />
        </mesh>
        {/* focus ring */}
        <mesh position={[0, 0.012, 0]} castShadow>
          <cylinderGeometry args={[0.061, 0.061, 0.026, 24]} />
          <meshStandardMaterial color="#14161a" roughness={0.95} />
        </mesh>
        {/* front element */}
        <mesh position={[0, 0.056, 0]}>
          <cylinderGeometry args={[0.049, 0.049, 0.004, 24]} />
          <meshStandardMaterial color="#1b2a3d" roughness={0.12} metalness={0.7} />
        </mesh>
      </group>
      {/* the red ring, because every photographer's camera has one.
        * A torus, not a cylinder — a cylinder is a solid disc and hid the lens. */}
      <mesh position={[0.02, 0.085, 0.152]}>
        <torusGeometry args={[0.054, 0.005, 8, 28]} />
        <meshStandardMaterial color={P.red} roughness={0.4} />
      </mesh>
    </Hotspot>
  )
}

function ModelCar() {
  return (
    <Hotspot
      id="machines"
      focus={FOCUS.machines}
      lift={0.3}
      position={[0.02, 0.03, 0]}
      rotation={[0, -0.22, 0]}
    >
      <B args={[0.42, 0.07, 0.185]} position={[0, 0.035, 0]} color={P.red} rough={0.26} metal={0.45} />
      <B args={[0.21, 0.062, 0.16]} position={[-0.015, 0.098, 0]} color={P.red} rough={0.26} metal={0.45} />
      <B args={[0.19, 0.04, 0.163]} position={[-0.015, 0.1, 0]} color="#1b2028" rough={0.15} metal={0.3} />
      {/* a splitter and a stripe, so it reads as a specific car */}
      <B args={[0.06, 0.018, 0.19]} position={[0.2, 0.014, 0]} color="#15181d" rough={0.5} />
      <B args={[0.42, 0.012, 0.03]} position={[0, 0.071, 0]} color={P.cream} rough={0.4} />
      {[-1, 1].map((sz) =>
        [-1, 1].map((sx) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.14, 0.018, sz * 0.098]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.039, 0.039, 0.028, 14]} />
            <meshStandardMaterial color={P.ink} roughness={0.9} />
          </mesh>
        ))
      )}
    </Hotspot>
  )
}

function Speaker() {
  const { active } = useRoom()
  const live = active === 'listen'
  return (
    <Hotspot
      id="listen"
      focus={FOCUS.listen}
      lift={0.4}
      position={[0.62, 0.03, 0]}
      rotation={[0, -0.3, 0]}
    >
      {/* cabinet */}
      <RoundedBox args={[0.17, 0.27, 0.145]} radius={0.012} smoothness={3} position={[0, 0.135, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7a6144" roughness={0.72} />
      </RoundedBox>
      {/* grille face */}
      <RoundedBox args={[0.15, 0.25, 0.012]} radius={0.006} smoothness={2} position={[0, 0.135, 0.072]} castShadow>
        <meshStandardMaterial color="#2a2a2c" roughness={0.95} />
      </RoundedBox>
      {/* woofer and tweeter — what makes it read as a speaker at this size */}
      <mesh position={[0, 0.085, 0.081]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.006, 24]} />
        <meshStandardMaterial color="#59595f" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.085, 0.085]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.005, 16]} />
        <meshStandardMaterial color="#4a4a50" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.198, 0.081]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.006, 20]} />
        <meshStandardMaterial color="#59595f" roughness={0.65} />
      </mesh>
      {/* power light */}
      <mesh position={[0.055, 0.03, 0.079]}>
        <circleGeometry args={[0.006, 12]} />
        <meshStandardMaterial
          color={live ? '#7dffc4' : '#3f5a4c'}
          emissive={live ? '#7dffc4' : '#22301f'}
          emissiveIntensity={live ? 3 : 0.4}
        />
      </mesh>
    </Hotspot>
  )
}

function Shelf() {
  return (
    <group position={[0.25, 1.5, -4.36]}>
      <B args={[1.85, 0.06, 0.3]} position={[0, 0, 0]} color={ASH} rough={0.55} />
      <B args={[1.75, 0.035, 0.035]} position={[0, -0.06, 0.12]} color={P.metalDark} metal={0.6} />
      <Dslr />
      <ModelCar />
      <Speaker />
    </group>
  )
}

/*
 * An astronaut helmet on the floor by the bed. The gold visor is what makes
 * it read as one instantly — a plain white sphere is just a ball.
 *
 * three's sphere runs phi from the -X axis, so a visor centred on the front
 * (+Z) starts at PI/2 minus half its sweep.
 */
function Helmet() {
  /* A front visor, not a band round the middle. */
  const SWEEP = Math.PI * 0.62

  return (
    <group position={[1.0, 0.235, -4.12]} rotation={[0, 0.55, 0]}>
      <GroundBlob position={[0, 0]} scale={[0.85, 0.85]} opacity={0.42} y={-0.223} />

      {/* shell */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.23, 28, 22]} />
        <meshStandardMaterial color="#eef0f2" roughness={0.42} metalness={0.06} />
      </mesh>

      {/* rim, drawn a touch wider than the visor so it frames it */}
      <mesh>
        <sphereGeometry
          args={[0.2415, 30, 24, Math.PI / 2 - (SWEEP + 0.2) / 2, SWEEP + 0.2, Math.PI * 0.245, Math.PI * 0.5]}
        />
        <meshStandardMaterial color="#9aa0a8" roughness={0.5} metalness={0.3} side={2} />
      </mesh>

      {/*
        The visor is barely metallic on purpose. There is no environment map
        in this scene, and a high-metalness surface has almost no diffuse to
        fall back on — it renders near-black, which is what a "gold" visor
        did here at night. Low metalness plus a little emissive keeps it gold
        in a dark room.
      */}
      <mesh castShadow>
        <sphereGeometry args={[0.2465, 30, 24, Math.PI / 2 - SWEEP / 2, SWEEP, Math.PI * 0.29, Math.PI * 0.4]} />
        <meshStandardMaterial
          color="#e5b449"
          /* Rough enough that nearby point lights spread into a sheen rather
             than three tight highlights — which sat on the visor like eyes. */
          roughness={0.52}
          metalness={0.22}
          emissive="#7a5410"
          emissiveIntensity={0.3}
          side={2}
        />
      </mesh>

      {/* neck ring it rests on */}
      <mesh position={[0, -0.185, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.135, 0.15, 0.055, 26]} />
        <meshStandardMaterial color="#d7dade" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.152, 0]}>
        <cylinderGeometry args={[0.142, 0.142, 0.022, 26]} />
        <meshStandardMaterial color="#6b727b" roughness={0.5} metalness={0.35} />
      </mesh>

      {/* Housings on the sides, unlit. Two glowing dots on a dark face read
          as eyes, which turned the whole thing into a bug. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.2, 0.045, -0.085]} rotation={[0, 0, side * -0.35]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.034, 0.042, 14]} />
            <meshStandardMaterial color="#dfe2e6" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.023, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.006, 14]} />
            <meshStandardMaterial color="#aeb4bb" roughness={0.45} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* a short aerial */}
      <mesh position={[-0.07, 0.225, -0.1]} rotation={[0.34, 0, 0.26]} castShadow>
        <cylinderGeometry args={[0.005, 0.007, 0.1, 8]} />
        <meshStandardMaterial color="#6b727b" roughness={0.45} metalness={0.4} />
      </mesh>

      {/* a patch, because every helmet has one */}
      <mesh position={[-0.15, -0.055, 0.145]} rotation={[0, -0.8, 0]}>
        <planeGeometry args={[0.07, 0.048]} />
        <meshStandardMaterial color={P.red} roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ========================================================== RACQUET ===== */
/*
 * Squash, not badminton. The giveaway is proportion: a badminton head is
 * small and sits on a long whippy shaft, where a squash head is nearly half
 * the racquet's total length, the throat is short, and the frame is thick.
 * There is also a bridge across the bottom of the head.
 */
const HEAD_Y = 0.55
const HEAD_W = 0.105
const HEAD_H = 0.15

function Racket() {
  const frame = { color: '#1f2a3a', metalness: 0.45, roughness: 0.38 }

  /* string positions, clipped to the ellipse so they stop at the frame */
  const mains = Array.from({ length: 9 }, (_, i) => -0.084 + i * 0.021)
  const crosses = Array.from({ length: 11 }, (_, i) => -0.12 + i * 0.024)

  return (
    <Hotspot id="sport" focus={FOCUS.sport} lift={0.95} position={[4.15, 0, -3.95]}>
      <group rotation={[0.16, -0.5, 0.1]}>
        {/* head: a tall ellipse, thick framed */}
        <group position={[0, HEAD_Y, 0]} scale={[1, HEAD_H / HEAD_W, 1]}>
          <mesh castShadow>
            <torusGeometry args={[HEAD_W, 0.0135, 10, 34]} />
            <meshStandardMaterial {...frame} />
          </mesh>
        </group>

        {/* strings */}
        {mains.map((x, i) => {
          const h = 2 * HEAD_H * Math.sqrt(Math.max(0, 1 - (x / HEAD_W) ** 2))
          return (
            <mesh key={`m${i}`} position={[x, HEAD_Y, 0]}>
              <boxGeometry args={[0.0026, h, 0.0026]} />
              <meshStandardMaterial color="#f2efe6" />
            </mesh>
          )
        })}
        {crosses.map((y, i) => {
          const w = 2 * HEAD_W * Math.sqrt(Math.max(0, 1 - (y / HEAD_H) ** 2))
          return (
            <mesh key={`c${i}`} position={[0, HEAD_Y + y, 0]}>
              <boxGeometry args={[w, 0.0026, 0.0026]} />
              <meshStandardMaterial color="#f2efe6" />
            </mesh>
          )
        })}

        {/* the bridge across the bottom of the head */}
        <mesh position={[0, HEAD_Y - 0.085, 0]} castShadow>
          <boxGeometry args={[0.13, 0.014, 0.016]} />
          <meshStandardMaterial {...frame} />
        </mesh>

        {/* short throat: two struts from the bridge down into the shaft */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.031, HEAD_Y - 0.128, 0]} rotation={[0, 0, side * 0.42]} castShadow>
            <cylinderGeometry args={[0.0095, 0.011, 0.1, 8]} />
            <meshStandardMaterial {...frame} />
          </mesh>
        ))}

        {/* shaft — deliberately short; this is most of the difference */}
        <mesh position={[0, 0.315, 0]} castShadow>
          <cylinderGeometry args={[0.0135, 0.015, 0.11, 10]} />
          <meshStandardMaterial {...frame} />
        </mesh>

        {/* grip, with a butt cap */}
        <mesh position={[0, 0.185, 0]} castShadow>
          <cylinderGeometry args={[0.0215, 0.0185, 0.16, 12]} />
          <meshStandardMaterial color="#2c2f36" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.101, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.024, 0.014, 12]} />
          <meshStandardMaterial color={P.red} roughness={0.7} />
        </mesh>

        {/* a squash ball, with its double-yellow dot */}
        <mesh position={[0.28, 0.02, 0.19]} castShadow>
          <sphereGeometry args={[0.0195, 14, 12]} />
          <meshStandardMaterial color="#16171b" roughness={0.78} />
        </mesh>
        {[-0.006, 0.006].map((d) => (
          <mesh key={d} position={[0.28 + d, 0.0385, 0.19]}>
            <sphereGeometry args={[0.0032, 8, 8]} />
            <meshStandardMaterial color="#e8d24a" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </Hotspot>
  )
}

/* ====================================================== MAP AND WALL ==== */
/*
 * The artwork is public/places-map.svg — swap that file and the board
 * changes. The SVG carries its own pins and labels, so there are no
 * geometry pins here to fall out of register with it.
 *
 * The plane is 1.6:1 to match the file's 1600x1000 viewBox; anything else
 * stretches the labels.
 */
function MapArt() {
  const tex = useLoader(TextureLoader, '/places-map.svg')
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return (
    <meshStandardMaterial
      map={tex}
      roughness={0.88}
      emissiveMap={tex}
      emissive="#ffffff"
      emissiveIntensity={0.16}
    />
  )
}

function WallMap() {
  const cards = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        x: i < 2 ? -1.62 : 1.62,
        y: (i % 2 === 0 ? 0.36 : -0.34) + rand(i) * 0.06,
        r: (rand(i * 3) - 0.5) * 0.5,
        c: ['#f2ead8', '#e9d6c0', '#dfe7ee'][i % 3],
      })),
    []
  )

  return (
    <Hotspot id="places" focus={FOCUS.places} lift={1.0} position={[-2.5, 2.36, -4.44]}>
      <B args={[2.58, 1.68, 0.07]} position={[0, 0, -0.01]} color="#4a3220" rough={0.7} />
      <B args={[2.46, 1.56, 0.02]} position={[0, 0, 0.03]} color="#0f1620" rough={0.9} />
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[2.4, 1.5]} />
        <MapArt />
      </mesh>

      {cards.map((c, i) => (
        <mesh key={`c${i}`} position={[c.x, c.y, 0.05]} rotation={[0, 0, c.r]} castShadow>
          <boxGeometry args={[0.38, 0.27, 0.008]} />
          <meshStandardMaterial color={c.c} roughness={0.95} />
        </mesh>
      ))}
    </Hotspot>
  )
}

/* ============================================================== BED ===== */
function Bed() {
  return (
    <>
      <GroundBlob position={[2.5, -3.3]} scale={[3.4, 3.4]} opacity={0.5} />
      <Hotspot id="bed" focus={FOCUS.bed} lift={1.0} position={[2.5, 0, -3.35]}>
        <B args={[2.0, 0.75, 0.1]} position={[0, 0.38, -1.06]} color="#4a3220" rough={0.7} />
        <B args={[2.0, 0.28, 2.1]} position={[0, 0.14, 0]} color={P.wood} rough={0.75} />
        <B args={[1.92, 0.22, 2.0]} position={[0, 0.38, 0]} color={P.cream} rough={0.95} />
        <B args={[1.96, 0.16, 1.35]} position={[0, 0.54, 0.3]} color={P.fabric} rough={1} />
        <B args={[1.96, 0.1, 0.42]} position={[0, 0.62, -0.32]} color={P.fabricDark} rough={1} />
        <B args={[0.8, 0.16, 0.42]} position={[-0.46, 0.56, -0.78]} color={P.trim} rough={1} rotation={[0, 0.1, 0]} />
        <B args={[0.8, 0.16, 0.42]} position={[0.46, 0.56, -0.78]} color={P.trim} rough={1} rotation={[0, -0.08, 0]} />
        <B args={[0.24, 0.03, 0.18]} position={[0.62, 0.64, 0.42]} color={P.red} rough={0.8} rotation={[0, 0.5, 0]} />
      </Hotspot>
    </>
  )
}

/* =========================================================== EXTRAS ===== */
function Plant() {
  return (
    <group position={[-0.35, 0, -4.05]}>
      <GroundBlob position={[0, 0]} scale={[1.1, 1.1]} opacity={0.42} />
      <PottedPlant position={[0, 0, 0]} scale={1.7} leaves={11} height={0.44} spread={0.16} seed={29} />
    </group>
  )
}

/* Steam off the mug — cheap, and it makes the desk look occupied. */
function Steam({ position }) {
  const tex = useMemo(() => createSteam(), [])
  const puffs = useRef()

  useFrame(({ clock }) => {
    if (!puffs.current) return
    const t = clock.elapsedTime
    puffs.current.children.forEach((m, i) => {
      const p = (t * 0.3 + i / puffs.current.children.length) % 1
      m.position.y = p * 0.38
      m.position.x = Math.sin(p * 5.5 + i * 2) * 0.04
      m.scale.setScalar(0.07 + p * 0.15)
      m.material.opacity = Math.sin(p * Math.PI) * 0.34
    })
  })

  return (
    <Billboard position={position}>
      <group ref={puffs}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} renderOrder={5}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </Billboard>
  )
}

function Mug() {
  return (
    <group position={[-1.38, DESK_Y + 0.035, -4.26]}>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.14, 18]} />
        <meshStandardMaterial color={P.red} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.006, 18]} />
        <meshStandardMaterial color="#3a2218" roughness={0.3} />
      </mesh>
      <mesh position={[0.088, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.038, 0.011, 8, 16]} />
        <meshStandardMaterial color={P.red} roughness={0.32} />
      </mesh>
      <Steam position={[0, 0.2, 0]} />
    </group>
  )
}

/* ========================================================== EXPORT ====== */
export default function Objects({ night }) {
  return (
    <group>
      <Desk />
      <Drawer />
      <Laptop night={night} />
      <Notebook />
      <DeskLamp night={night} />
      <Chair />
      <Bookshelf night={night} />
      <Sketches />
      <WallPhotos />
      <SalahFrame />
      <Telly night={night} />
      <Couch />
      <SideTable night={night} />
      <Shelf />
      <Helmet />
      <VinylFrame />
      <Racket />
      <WallMap />
      <Bed />
      <Plant />
      <Mug />

      {/* greenery and small warm lights, spread around rather than pooled */}
      <PottedPlant position={[-3.86, 0, 3.22]} scale={1.55} leaves={9} height={0.46} spread={0.16} seed={3} />
      <GroundBlob position={[-3.86, 3.22]} scale={[1.5, 1.5]} opacity={0.42} />
      <FloorLamp position={[-4.18, 0, 4.06]} night={night} />
      <Candle position={[-2.94, 0, 3.3]} night={night} />

      <PottedPlant position={[1.55, 0.98, -4.42]} scale={0.6} leaves={7} height={0.4} spread={0.14} droop={0.3} seed={17} />
      <PottedPlant position={[3.46, 0.98, -4.42]} scale={0.5} leaves={6} height={0.34} spread={0.12} droop={0.4} seed={23} />
      <Candle position={[2.52, 0.97, -4.42]} night={night} />
    </group>
  )
}
