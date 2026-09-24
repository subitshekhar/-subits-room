/* Where the camera lands for each object. Distance scales with the object's
 * size (~1.8x its largest dimension plus a bit), so a bookshelf and a laptop
 * fill a comparable slice of frame; a fixed distance made the big ones fill
 * the screen with abstract texture. Kept apart from the scene so
 * editing a prop hot-reloads instead of tearing the whole canvas down.
 *
 * `shift` slides the look-point to screen-right by that many units, so the
 * object ends up in the left of frame rather than under the panel.
 * `tools/check-focus.mjs` verifies every entry against the orbit limits.
 */
export const FOCUS = {
  work: { pos: [-1.82, 1.37, -2.54], target: [-2.92, 0.95, -4.0], shift: 0.46 },
  think: { pos: [0.83, 2.53, -1.69], target: [-4.2, 1.2, -2.95], shift: 0.5 },
  liverpool: { pos: [-1.68, 2.41, -0.64], target: [-4.4, 1.8, -0.9], shift: 0.42 },
  play: { pos: [1.18, 2.18, 1.81], target: [-4.2, 1.1, 1.5], shift: 0.4 },
  machines: { pos: [0.82, 1.94, -2.52], target: [0.27, 1.55, -4.36], shift: 0.4 },
  photos: { pos: [0.16, 1.95, -2.72], target: [-0.33, 1.6, -4.36], shift: 0.4 },
  listen: { pos: [1.32, 1.96, -2.79], target: [0.85, 1.63, -4.36], shift: 0.4 },
  music: { pos: [-1.69, 2.35, 4.38], target: [-4.35, 1.75, 3.4], shift: 0.4 },
  sport: { pos: [3.23, 1.89, -0.73], target: [4.1, 0.85, -3.9], shift: 0.4 },
  places: { pos: [-1.28, 3.12, 1.52], target: [-2.5, 2.3, -4.4], shift: 0.5 },
  thinking: { pos: [-1.08, 1.75, -2.0], target: [-1.85, 0.82, -3.9], shift: 0.4 },
  bed: { pos: [3.86, 3.15, 0.68], target: [2.4, 0.5, -3.3], shift: 0.5 },
  /* Looks down into the open tray. The drawer face is 0.6 tall and the tray
   * floor sits at 0.15, so anything shallower than about 35 degrees of polar
   * just shows you the front panel. */
  drawer: { pos: [-1.19, 2.2, -2.13], target: [-1.55, 0.16, -3.54], shift: 0.3 },
}
