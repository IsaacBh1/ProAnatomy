import { Vector3, type Camera } from 'three'
import type { BandRect } from '../types/view'
import type { ModelObject } from './buildModelObject'

interface ScreenBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const CORNER = new Vector3()

/**
 * Screen-space AABB of a world-space box. Returns null when every corner is behind the camera.
 * Corners that are individually behind the camera are skipped — a conservative approximation
 * that's exact for parts fully in front and safely inclusive for parts that straddle the plane.
 */
function projectBox(
  box: { min: Vector3; max: Vector3 },
  matrixWorld: { elements: number[] } | { elements: number[] },
  camera: Camera,
  width: number,
  height: number,
): ScreenBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let any = false

  for (let i = 0; i < 8; i++) {
    CORNER.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    )
    // The box is in the mesh's local space. mesh.matrixWorld maps local → world; the camera's
    // inverse maps world → view; the projection maps view → clip.
    CORNER.applyMatrix4(matrixWorld as never).applyMatrix4(camera.matrixWorldInverse)
    if (CORNER.z >= 0) continue // behind the camera
    CORNER.applyMatrix4(camera.projectionMatrix)

    const x = (CORNER.x * 0.5 + 0.5) * width
    const y = (-CORNER.y * 0.5 + 0.5) * height
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    any = true
  }

  return any ? { minX, minY, maxX, maxY } : null
}

/** Visible parts whose screen-space AABB intersects `rect` (canvas pixels). Skin is never selected. */
export function collectPartsInRect(
  entries: ModelObject['entries'],
  camera: Camera,
  rect: BandRect,
  viewport: { width: number; height: number },
): Set<string> {
  camera.updateMatrixWorld()

  const hits = new Set<string>()
  const rectMaxX = rect.x + rect.width
  const rectMaxY = rect.y + rect.height

  for (const { part, mesh, box } of entries.values()) {
    if (!mesh.visible || part.system === 'integumentary') continue

    const projected = projectBox(
      box,
      mesh.matrixWorld as unknown as { elements: number[] },
      camera,
      viewport.width,
      viewport.height,
    )
    if (!projected) continue

    // No overlap on either axis → skip.
    if (
      projected.maxX < rect.x ||
      projected.minX > rectMaxX ||
      projected.maxY < rect.y ||
      projected.minY > rectMaxY
    ) {
      continue
    }

    hits.add(part.id)
  }

  return hits
}
