/* ---------------------------------------------------------------------------
 *  What the record is doing, readable from both sides of the app.
 *
 *  The 3D scene sits inside the room's context provider and the panel does
 *  not, so neither can hand state to the other. This is a plain module-level
 *  store instead: the panel writes to it as the Spotify embed reports in,
 *  and the scene subscribes so the disc can turn and the lamp can take its
 *  colour from the sleeve.
 * ------------------------------------------------------------------------- */

import { useSyncExternalStore } from 'react'

let state = {
  /* true only while the embed is actually producing sound */
  playing: false,
  /* the track the embed is cued to, straight out of music.json */
  track: null,
}

const listeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

export function setPlayback(next) {
  const merged = { ...state, ...next }
  if (merged.playing === state.playing && merged.track === state.track) return
  state = merged
  emit()
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const snapshot = () => state

/* Components re-render only when `playing` or `track` actually changes. */
export function usePlayback() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/*
 * The scene reads this every frame and must not re-render to do it, so it
 * gets the raw object rather than the hook.
 */
export const readPlayback = snapshot
