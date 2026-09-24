import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Select } from '@react-three/postprocessing'
import { useRoom } from '../roomContext.jsx'
import { SECTIONS } from '../content.js'

/*
 * Wraps a cluster of meshes and makes it a clickable part of the story.
 *
 * Hover highlighting is done by marking the contents as selected; the
 * Outline effect in App.jsx then traces the silhouette of the whole
 * selection. Earlier attempts expanded each mesh into its own shell, which
 * outlined every book and every shelf board rather than the object — a
 * per-mesh trick cannot know where one object's edge actually is.
 */
/*
 * `label` defaults to the section's own nav name, so the tag reads "PLAY"
 * rather than "PS5 → PLAY" and there is one place the wording lives.
 * Pass label explicitly only where there's no section name to use.
 */
export default function Hotspot({ id, label, focus, lift = 0.5, children, ...groupProps }) {
  const { hovered, setHovered, select, active } = useRoom()
  const tag = label ?? SECTIONS[id]?.nav
  const inner = useRef()

  const isHot = hovered === id
  const isOpen = active === id

  useFrame((_, dt) => {
    if (!inner.current) return
    const k = 1 - Math.pow(0.0001, Math.min(dt, 0.1))
    const want = isHot || isOpen ? 1.03 : 1
    const s = inner.current.scale
    s.setScalar(s.x + (want - s.x) * k)
  })

  return (
    <group
      {...groupProps}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(id)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered((h) => (h === id ? null : h))
      }}
      onClick={(e) => {
        e.stopPropagation()
        select(id, focus)
      }}
    >
      <Select enabled={isHot}>
        <group ref={inner}>{children}</group>
      </Select>

      {isHot && tag && (
        <Html center position={[0, lift, 0]} zIndexRange={[20, 0]} pointerEvents="none">
          <div className="tag">{tag}</div>
        </Html>
      )}
    </group>
  )
}
