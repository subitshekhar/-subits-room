/* ---------------------------------------------------------------------------
 *  The corner hit happens on the television and the reaction happens on the
 *  couch, which are different components in different parts of the tree.
 *
 *  This is a timestamp, not React state: the person on the couch reads it
 *  inside useFrame, so a celebration costs no re-render at all.
 * ------------------------------------------------------------------------- */

const DURATION = 2.8

let endsAt = 0
/* remembered per cheer: the envelope below is measured against the length
 * this one was actually given, not against the default */
let span = DURATION

export function cheer(seconds = DURATION) {
  span = seconds
  endsAt = performance.now() + seconds * 1000
}

/*
 * 0 while nothing is happening, rising to 1 with the arms and easing back
 * down. The arms snap up fast — that is what makes it read as a reaction
 * rather than a stretch — and come down slowly.
 */
export function cheerLevel() {
  const left = (endsAt - performance.now()) / 1000
  if (left <= 0) return 0

  const elapsed = span - left
  const up = Math.min(1, elapsed / 0.16)
  const down = Math.min(1, left / 0.6)
  return Math.min(up, down)
}
