/* Scenery markers. Light pools, beams and cast-shadow blobs are part of the
 * picture, not part of the interface: they must never take a pointer event
 * nor pick up a hover outline. Kept in their own module so the files that
 * use them keep a single component export and stay hot-reloadable. */

export const NO_HIT = () => {}
export const DECOR = { decor: true }
