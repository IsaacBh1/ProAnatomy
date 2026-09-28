import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3, type Box3, type PerspectiveCamera } from 'three'
import { CAMERA_ANIMATION_MS, FOCUS_PADDING } from '../constants/viewer'
import { useCameraStore } from '../store/cameraStore'
import type { CameraApi, CameraPose, StandardView, Vec3 } from '../types/camera'
import type { ModelObject } from '../utils/buildModelObject'
import { computeFitPose, type OrbitTargetControls } from '../utils/fitCameraToBox'
import { boxOfParts, boxOfVisibleParts } from '../utils/partBounds'

const RECENTER_TOLERANCE = 0.005
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z]

/** Direction the camera should sit in, seen from the target. */
const STANDARD_VIEW_DIRECTIONS: Record<StandardView, Vec3> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  side: [Math.SQRT1_2, 0, Math.SQRT1_2],
}

/** OrbitControls exposes distance limits as plain properties. */
interface ControlsWithLimits extends OrbitTargetControls {
  minDistance?: number
  maxDistance?: number
}

/** Registers a CameraApi for the current model, so code outside the Canvas can move the camera. */
export function useCameraApi({ entries }: ModelObject): void {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const controls = useThree((state) => state.controls) as unknown as ControlsWithLimits | null
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!controls) return

    let animation = 0
    let frame = 0

    const animateTo = (pose: CameraPose) => {
      const id = ++animation
      cancelAnimationFrame(frame)

      const fromPosition = camera.position.clone()
      const fromTarget = controls.target.clone()
      const toPosition = new Vector3(...pose.position)
      const toTarget = new Vector3(...pose.target)
      const startedAt = performance.now()

      const step = (now: number) => {
        if (id !== animation) return // superseded by a newer animation
        const t = Math.min((now - startedAt) / CAMERA_ANIMATION_MS, 1)
        const eased = easeInOutCubic(t)
        camera.position.lerpVectors(fromPosition, toPosition, eased)
        controls.target.lerpVectors(fromTarget, toTarget, eased)
        controls.update()
        invalidate()
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }

    const cancelAnimation = () => {
      animation++
      cancelAnimationFrame(frame)
    }

    const fitTo = (box: Box3) => {
      const direction = camera.position.clone().sub(controls.target)
      const pose = computeFitPose(camera, box, FOCUS_PADDING, direction)
      if (pose) animateTo(pose)
    }

    const clampDistance = (distance: number): number => {
      const min = controls.minDistance ?? 0.001
      const max = controls.maxDistance ?? Number.POSITIVE_INFINITY
      return Math.min(Math.max(distance, min), max)
    }

    const api: CameraApi = {
      getPose: () => ({ position: toVec3(camera.position), target: toVec3(controls.target) }),
      animateTo,
      focusOnParts: (ids) => fitTo(boxOfParts(entries, ids)),
      frameVisible: () => fitTo(boxOfVisibleParts(entries)),
      recenterOnVisible: () => {
        const box = boxOfVisibleParts(entries)
        if (box.isEmpty()) return
        const delta = box.getCenter(new Vector3()).sub(controls.target)
        if (delta.length() < camera.position.distanceTo(controls.target) * RECENTER_TOLERANCE) return
        animateTo({
          position: toVec3(camera.position.clone().add(delta)),
          target: toVec3(controls.target.clone().add(delta)),
        })
      },
      zoomBy: (factor) => {
        // Zoom must feel instant, so cancel any in-flight animation rather than trying to compete.
        cancelAnimation()
        const offset = camera.position.clone().sub(controls.target)
        offset.setLength(clampDistance(offset.length() * factor))
        camera.position.copy(controls.target).add(offset)
        controls.update()
        invalidate()
      },
      resetView: () => fitTo(boxOfVisibleParts(entries)),
      setStandardView: (view) => {
        const [x, y, z] = STANDARD_VIEW_DIRECTIONS[view]
        const direction = new Vector3(x, y, z).normalize()
        const distance = clampDistance(camera.position.distanceTo(controls.target))
        const position = controls.target.clone().addScaledVector(direction, distance)
        animateTo({ position: toVec3(position), target: toVec3(controls.target) })
      },
    }

    useCameraStore.getState().setApi(api)
    return () => {
      cancelAnimation()
      useCameraStore.getState().setApi(null)
    }
  }, [camera, controls, entries, invalidate])
}
