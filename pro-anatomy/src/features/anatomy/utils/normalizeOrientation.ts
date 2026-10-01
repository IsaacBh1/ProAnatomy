import { Box3, Vector3 } from 'three'
import type { AnatomyPart } from '../types/model'

/**
 * Rotates all geometries in place so the body's longest axis is Y (up). Both
 * prototypes did this at runtime by rotating the scene root.
 *
 * ASSUMPTION: the input is a *whole body*, so its longest bounding-box axis is
 * unambiguously the head-to-toe axis. This is only correct because we call it
 * once on the full model at load time. If you ever feed a sub-assembly (an
 * isolated arm, a single organ), the longest axis will often be the wrong one
 * and the piece will be rotated onto its side. Don't call this from anywhere
 * other than `loadAnatomyModel`.
 */
export function normalizeOrientation(parts: readonly AnatomyPart[]): void {
  const bounds = new Box3()
  for (const { geometry } of parts) {
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    if (geometry.boundingBox) bounds.union(geometry.boundingBox)
  }
  if (bounds.isEmpty()) return

  const size = bounds.getSize(new Vector3())
  const longest = size.y >= size.x && size.y >= size.z ? 'y' : size.x >= size.z ? 'x' : 'z'
  if (longest === 'y') return

  for (const { geometry } of parts) {
    if (longest === 'z') geometry.rotateX(-Math.PI / 2)
    else geometry.rotateZ(Math.PI / 2)
  }
}
