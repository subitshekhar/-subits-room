import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { HOME } from '../room.js'

const DURATION = 1.15
const UP = new Vector3(0, 1, 0)
const _dir = new Vector3()
const _right = new Vector3()

/* Slow out of the old framing, slow into the new one. A plain lerp floats to
 * a stop and never quite arrives; this lands. */
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/*
 * Flies the camera to whatever was clicked, then gets out of the way.
 *
 * A focus may carry `shift`, which slides the look-point to screen-right so
 * the object ends up in the left of frame instead of underneath the panel.
 */
export default function CameraRig({ focus }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)

  const fromPos = useRef(new Vector3())
  const fromTgt = useRef(new Vector3())
  const toPos = useRef(new Vector3(...HOME.pos))
  const toTgt = useRef(new Vector3(...HOME.target))
  const t = useRef(1)

  useEffect(() => {
    if (!controls) return
    const f = focus ?? HOME

    toPos.current.set(...f.pos)
    toTgt.current.set(...f.target)

    if (f.shift) {
      _dir.subVectors(toTgt.current, toPos.current)
      _right.crossVectors(_dir, UP).normalize().multiplyScalar(f.shift)
      toTgt.current.add(_right)
    }

    fromPos.current.copy(camera.position)
    fromTgt.current.copy(controls.target)
    t.current = 0
  }, [focus, controls, camera])

  /* Any drag hands control straight back to the user, mid-flight or not. */
  useEffect(() => {
    if (!controls) return
    const cancel = () => {
      t.current = 1
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controls])

  useFrame((_, dt) => {
    if (!controls || t.current >= 1) return
    t.current = Math.min(1, t.current + dt / DURATION)
    const e = easeInOutCubic(t.current)
    camera.position.lerpVectors(fromPos.current, toPos.current, e)
    controls.target.lerpVectors(fromTgt.current, toTgt.current, e)
    controls.update()
  })

  return null
}
