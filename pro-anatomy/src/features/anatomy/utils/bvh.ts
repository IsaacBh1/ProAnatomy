// src/features/anatomy/utils/bvh.ts
import { BufferGeometry, Mesh } from 'three'
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh'

/**
 * Installs the BVH raycast extension on Three.js prototypes, once per page.
 *
 * The default `Mesh.raycast` walks every triangle of every mesh until it finds
 * a hit. For BodyParts3D models with thousands of parts, that's hundreds of
 * thousands of triangle intersection tests on every pointer-move hover frame.
 * `three-mesh-bvh` swaps in a bounding volume hierarchy — logarithmic, not
 * linear.
 *
 * Patches `BufferGeometry.prototype` and `Mesh.prototype` globally, which
 * affects the drawing-surface picker too. That's intentional: the picker does
 * the same linear walk and gets the same speed-up for free.
 *
 * Idempotent, so calling it from multiple modules is safe.
 */
let installed = false

export function installBvhRaycast(): void {
  if (installed) return
  installed = true
  // TS doesn't know about these prototype extensions until the library's own
  // module augmentation loads; cast through a structural type.
  ;(BufferGeometry.prototype as unknown as { computeBoundsTree: typeof computeBoundsTree }).computeBoundsTree =
    computeBoundsTree
  ;(
    BufferGeometry.prototype as unknown as { disposeBoundsTree: typeof disposeBoundsTree }
  ).disposeBoundsTree = disposeBoundsTree
  ;(Mesh.prototype as unknown as { raycast: typeof acceleratedRaycast }).raycast = acceleratedRaycast
}

interface WithBvh {
  computeBoundsTree?: () => void
  disposeBoundsTree?: () => void
}

/** Builds the acceleration structure for `geometry`. Cheap; call once per part at load. */
export function buildBvh(geometry: BufferGeometry): void {
  ;(geometry as BufferGeometry & WithBvh).computeBoundsTree?.()
}

/** Frees the BVH memory. Call before `geometry.dispose()`. */
export function disposeBvh(geometry: BufferGeometry): void {
  ;(geometry as BufferGeometry & WithBvh).disposeBoundsTree?.()
}
