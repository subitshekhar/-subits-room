import { useMemo } from 'react'
import { createShadowBlob } from './textures.js'
import { DECOR, NO_HIT } from './decor.js'

/* A soft dark pool under a piece of furniture, so nothing looks pasted on. */
export default function GroundBlob({ position, scale = [1, 1], opacity = 0.5, rotation = 0, y = 0.012 }) {
  const map = useMemo(() => createShadowBlob(0.6), [])
  return (
    <mesh
      position={[position[0], y, position[1]]}
      rotation={[-Math.PI / 2, 0, rotation]}
      renderOrder={2}
      raycast={NO_HIT}
      userData={DECOR}
    >
      <planeGeometry args={[scale[0], scale[1]]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} opacity={opacity} />
    </mesh>
  )
}
