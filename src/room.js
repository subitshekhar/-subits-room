/* Room geometry and the camera's resting place. Plain data, no React — so
 * tooling (and tools/check-focus.mjs) can import it directly. */

export const ROOM = {
  w: 9,
  d: 9,
  h: 3.4,
  wallZ: -4.6,
  wallX: -4.6,
  /* The hole in the back wall, in world units. */
  window: { x0: 1.1, x1: 3.9, y0: 1.0, y1: 2.7 },
}

/* Framed so the room clears the index list down the left edge. Camera and
 * look-point are offset by the same vector, so this is a pure lateral pan —
 * the viewing angle, distance and orbit limits are all unchanged. */
export const HOME = { pos: [8.08, 6.85, 12.29], target: [-1.71, 1.55, 0.85] }
