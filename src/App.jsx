import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Outline, Selection } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { RoomContext } from './roomContext.jsx'
import { HOME } from './room.js'
import { MOODS } from './scene/palette.js'
import Shell from './scene/Shell.jsx'
import Objects from './scene/Objects.jsx'
import { FOCUS } from './scene/focus.js'
import CameraRig from './scene/CameraRig.jsx'
import Panel from './ui/Panel.jsx'
import Foliage from './ui/Foliage.jsx'
import Hud from './ui/Hud.jsx'
import { SECTIONS } from './content.js'

function Lights({ night }) {
  const m = night ? MOODS.night : MOODS.day
  return (
    <>
      <ambientLight color={m.ambient.color} intensity={m.ambient.intensity} />
      <hemisphereLight color={m.fill.color} groundColor="#6b4a30" intensity={m.fill.intensity} />
      {/* A soft warm fill at night. The lamps make the pools; without this
        * everything between them falls to near-black. */}
      {night && (
        <pointLight position={[0.4, 2.7, -0.4]} color="#ffb478" intensity={5} distance={11} decay={1.5} />
      )}
      <directionalLight
        color={m.sun.color}
        intensity={m.sun.intensity}
        position={m.sun.position}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
    </>
  )
}

export default function App() {
  const [night, setNight] = useState(true)
  const [active, setActive] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [focus, setFocus] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const select = useCallback((id, f) => {
    if (!SECTIONS[id]) return
    setActive(id)
    const target = f ?? FOCUS[id]
    setFocus(target ? { ...target } : null)
  }, [])

  const reset = useCallback(() => {
    setActive(null)
    setFocus({ ...HOME })
  }, [])

  const toggleNight = useCallback(() => setNight((n) => !n), [])

  /* Pointer feedback for anything clickable. */
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  const ctx = useMemo(
    () => ({ hovered, setHovered, select, active, night, toggleNight }),
    [hovered, select, active, night, toggleNight]
  )

  const mood = night ? MOODS.night : MOODS.day

  return (
    <div className={`app ${night ? 'is-night' : 'is-day'}`}>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
        onCreated={() => setTimeout(() => setLoaded(true), 450)}
        onPointerMissed={reset}
      >
        <PerspectiveCamera makeDefault fov={36} position={HOME.pos} near={0.1} far={160} />
        <color attach="background" args={[mood.bg]} />
        <fog attach="fog" args={mood.fog} />

        <Suspense fallback={null}>
          {/* Selection has to wrap both the <Select>s inside Hotspot and the
            * composer that draws their outline. */}
          <Selection>
            <RoomContext.Provider value={ctx}>
              <Lights night={night} />
              <Shell night={night} />
              <Objects night={night} />
            </RoomContext.Provider>

            <EffectComposer multisampling={4}>
              <Outline
                blur
                xRay={false}
                edgeStrength={5}
                pulseSpeed={0}
                width={1400}
                visibleEdgeColor={night ? 0xffd79a : 0xffe9c2}
                hiddenEdgeColor={0x000000}
                blendFunction={BlendFunction.SCREEN}
              />
            </EffectComposer>
          </Selection>
        </Suspense>

        <CameraRig focus={focus} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.2}
          maxDistance={22}
          minPolarAngle={0.25}
          maxPolarAngle={1.47}
          minAzimuthAngle={-0.45}
          maxAzimuthAngle={1.62}
          target={HOME.target}
        />
      </Canvas>

      <Foliage night={night} />

      <Hud
        night={night}
        toggleNight={toggleNight}
        active={active}
        select={select}
        reset={reset}
        loaded={loaded}
        hovered={hovered}
        setHovered={setHovered}
      />

      {active && <Panel id={active} night={night} onClose={reset} />}
    </div>
  )
}
