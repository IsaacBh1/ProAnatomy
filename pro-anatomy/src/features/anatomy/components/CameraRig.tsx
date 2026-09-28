import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { Box3, PerspectiveCamera } from 'three'
import { fitCameraToBox, type OrbitTargetControls } from '../utils/fitCameraToBox'

/** Frames the model whenever a new one is shown. */
export function CameraRig({ bounds }: { bounds: Box3 }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!controls) return
    fitCameraToBox(
      camera as PerspectiveCamera,
      controls as unknown as OrbitTargetControls,
      bounds,
    )
    invalidate()
  }, [bounds, camera, controls, invalidate])

  return null
}
