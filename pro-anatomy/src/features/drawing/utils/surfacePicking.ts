import { Vector3, type PerspectiveCamera, type Raycaster } from 'three'
import type { SurfaceStroke } from '../types'

// Reused across calls: picking runs on pointerdown and every pointermove while
// erasing, so allocating fresh Vector3s per segment would be a lot of garbage.
const SEGMENT_A = new Vector3()
const SEGMENT_B = new Vector3()
const POINT_ON_SEGMENT = new Vector3()

/**
 * Picks the surface stroke whose nearest segment is closest to the pointer ray,
 * within a pixel-based threshold.
 *
 * The threshold is converted from pixels to world units at the depth of each
 * candidate point, so the pick feels equally generous whether the stroke is right
 * in front of the camera or far away. Returns null when nothing is close enough.
 */
export function pickSurfaceStroke(
  raycaster: Raycaster,
  camera: PerspectiveCamera,
  strokes: readonly SurfaceStroke[],
  thresholdPixels: number,
  viewportHeight: number,
): SurfaceStroke | null {
  const fovFactor = 2 * Math.tan((camera.fov * Math.PI) / 360)
  let best: SurfaceStroke | null = null
  let bestDistanceSq = Infinity

  for (const stroke of strokes) {
    const points = stroke.points
    if (points.length < 2) continue

    for (let i = 1; i < points.length; i++) {
      const [ax, ay, az] = points[i - 1]
      const [bx, by, bz] = points[i]
      SEGMENT_A.set(ax, ay, az)
      SEGMENT_B.set(bx, by, bz)

      const distanceSq = raycaster.ray.distanceSqToSegment(
        SEGMENT_A,
        SEGMENT_B,
        undefined,
        POINT_ON_SEGMENT,
      )
      if (distanceSq >= bestDistanceSq) continue

      const depth = camera.position.distanceTo(POINT_ON_SEGMENT)
      const thresholdWorld = (thresholdPixels * fovFactor * depth) / viewportHeight
      if (distanceSq > thresholdWorld * thresholdWorld) continue

      bestDistanceSq = distanceSq
      best = stroke
    }
  }

  return best
}
