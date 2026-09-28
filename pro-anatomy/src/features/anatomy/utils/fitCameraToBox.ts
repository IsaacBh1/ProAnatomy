import { MathUtils, Vector3, type Box3, type PerspectiveCamera } from 'three'
import { CAMERA_FIT_PADDING } from '../constants/viewer'
import type { CameraPose, Vec3 } from '../types/camera'

/** The only part of OrbitControls these helpers need. */
export interface OrbitTargetControls {
  target: Vector3
  update: () => void
}

export interface FitPose extends CameraPose {
  distance: number
}

const FRONT = new Vector3(0, 0, 1)
const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z]

/** Pure: where the camera must be to frame `box`, seen from `direction` (target → camera). */
export function computeFitPose(
  camera: PerspectiveCamera,
  box: Box3,
  padding = CAMERA_FIT_PADDING,
  direction: Vector3 = FRONT,
): FitPose | null {
  if (box.isEmpty()) return null

  const center = box.getCenter(new Vector3())
  const radius = Math.max(box.getSize(new Vector3()).length() / 2, 0.005)

  const verticalFov = MathUtils.degToRad(camera.fov)
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
  const distance = (radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) * padding

  const dir = direction.lengthSq() < 1e-8 ? FRONT.clone() : direction.clone().normalize()
  return {
    position: toVec3(center.clone().addScaledVector(dir, distance)),
    target: toVec3(center),
    distance,
  }
}

export function fitCameraToBox(
  camera: PerspectiveCamera,
  controls: OrbitTargetControls,
  box: Box3,
  padding = CAMERA_FIT_PADDING,
): void {
  const fit = computeFitPose(camera, box, padding)
  if (!fit) return

  camera.near = fit.distance * 0.001
  camera.far = fit.distance * 100
  camera.position.set(...fit.position)
  camera.up.set(0, 1, 0)
  camera.updateProjectionMatrix()

  controls.target.set(...fit.target)
  controls.update()
}
