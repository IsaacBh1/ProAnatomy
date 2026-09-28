import { Box3, Vector3 } from 'three'
import type { AnatomyPart } from '../types/model'

/**
 * Rotates all geometries in place so the body's longest axis is Y (up).
 * Both prototypes did this at runtime by rotating the scene root.
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
