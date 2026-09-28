import type { CameraPose, Vec3 } from '../types/camera'
import type { ViewSnapshot } from '../types/view'

const sameSet = (a: readonly string[], b: readonly string[]) => {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every((id) => set.has(id))
}

const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Poses are equal when they differ by less than 0.1% of the camera distance. */
function samePose(a: CameraPose | null, b: CameraPose | null): boolean {
  if (!a || !b) return a === b
  const tolerance = (distance(a.position, a.target) || 1) * 0.001
  return distance(a.position, b.position) < tolerance && distance(a.target, b.target) < tolerance
}

/** Used to avoid stacking identical history entries. */
export function snapshotsEqual(a: ViewSnapshot, b: ViewSnapshot): boolean {
  const sameIsolation =
    a.isolatedIds === null || b.isolatedIds === null
      ? a.isolatedIds === b.isolatedIds
      : sameSet(a.isolatedIds, b.isolatedIds)

  return (
    sameIsolation &&
    sameSet(a.selectedIds, b.selectedIds) &&
    sameSet(a.hiddenIds, b.hiddenIds) &&
    sameSet(a.activePresetIds, b.activePresetIds) &&
    samePose(a.pose, b.pose)
  )
}
